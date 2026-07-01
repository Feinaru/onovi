# Onovi Calendar - Implementation Plan

## 📋 Quick Reference

This document provides a step-by-step implementation guide for the unified calendar workspace.

**See also**: `CALENDAR_ARCHITECTURE.md` for complete product vision and technical details.

---

## Phase 1: Database Schema (Week 1)

### New Tables to Create

```sql
-- 1. Calendar Events (Generic events created manually)
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(10) NOT NULL,  -- YYYY-MM-DD
  start_time VARCHAR(5) NOT NULL,  -- HH:MM
  end_time VARCHAR(5) NOT NULL,
  color VARCHAR(7) DEFAULT '#9ca3af',
  event_type VARCHAR(50) DEFAULT 'APPOINTMENT',
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  is_blocker BOOLEAN DEFAULT true,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_business_date ON calendar_events(business_id, date);

-- 2. Time Blocks (Breaks, lunch, personal time)
CREATE TABLE time_blocks (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  title VARCHAR(255) NOT NULL,
  date VARCHAR(10) NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  color VARCHAR(7) DEFAULT '#f59e0b',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(50),  -- DAILY, WEEKDAYS, WEEKLY, etc.
  recurrence_end_date VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_blocks_business_date ON time_blocks(business_id, date);

-- 3. Vacations (Multi-day time off)
CREATE TABLE vacations (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  title VARCHAR(255) DEFAULT 'Vacation',
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10) NOT NULL,
  color VARCHAR(7) DEFAULT '#8b5cf6',
  is_public BOOLEAN DEFAULT false,  -- Show "unavailable" to customers
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vacations_business_dates ON vacations(business_id, start_date, end_date);
```

### Prisma Schema

Add to `schema.prisma`:

```prisma
model CalendarEvent {
  id            Int      @id @default(autoincrement())
  businessId    Int
  title         String
  description   String?
  date          String
  startTime     String
  endTime       String
  color         String   @default("#9ca3af")
  eventType     String   @default("APPOINTMENT")
  customerName  String?
  customerPhone String?
  customerEmail String?
  isBlocker     Boolean  @default(true)
  location      String?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId, date])
}

model TimeBlock {
  id                Int      @id @default(autoincrement())
  businessId        Int
  title             String
  date              String
  startTime         String
  endTime           String
  color             String   @default("#f59e0b")
  isRecurring       Boolean  @default(false)
  recurrenceRule    String?
  recurrenceEndDate String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId, date])
}

model Vacation {
  id         Int      @id @default(autoincrement())
  businessId Int
  title      String   @default("Vacation")
  startDate  String
  endDate    String
  color      String   @default("#8b5cf6")
  isPublic   Boolean  @default(false)
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId, startDate, endDate])
}

// Update Business model
model Business {
  // ... existing fields
  slots          Slot[]
  bookings       Booking[]
  calendarEvents CalendarEvent[]
  timeBlocks     TimeBlock[]
  vacations      Vacation[]
}
```

### Migration Command

```bash
npx prisma migrate dev --name add_calendar_events
npx prisma generate
```

---

## Phase 2: Backend API (Week 2)

### Unified Calendar Endpoint

Create: `server/src/routes/calendar.routes.js`

```javascript
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

/**
 * GET /api/business/:businessId/calendar
 * Get all calendar events for a date range
 */
router.get('/:businessId', auth(), async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { from, to } = req.query;

    // Verify ownership
    if (req.user.role !== 'ADMIN') {
      const business = await prisma.business.findUnique({
        where: { id: Number(businessId) }
      });
      if (!business || business.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    // Fetch all event types in parallel
    const [slots, bookings, calendarEvents, timeBlocks, vacations] = await Promise.all([
      // Published Gaps (Slots)
      prisma.slot.findMany({
        where: {
          businessId: Number(businessId),
          date: { gte: from, lte: to }
        },
        include: { service: true, booking: true }
      }),

      // Onovi Bookings
      prisma.booking.findMany({
        where: {
          businessId: Number(businessId),
          slot: { date: { gte: from, lte: to } }
        },
        include: {
          slot: true,
          service: true,
          customer: { select: { id: true, fullName: true, phone: true } }
        }
      }),

      // Calendar Events
      prisma.calendarEvent.findMany({
        where: {
          businessId: Number(businessId),
          date: { gte: from, lte: to }
        }
      }),

      // Time Blocks
      prisma.timeBlock.findMany({
        where: {
          businessId: Number(businessId),
          date: { gte: from, lte: to }
        }
      }),

      // Vacations (overlap with date range)
      prisma.vacation.findMany({
        where: {
          businessId: Number(businessId),
          OR: [
            { startDate: { lte: to }, endDate: { gte: from } }
          ]
        }
      })
    ]);

    // Transform to unified format
    const events = [
      ...slots.map(slot => ({
        id: `slot-${slot.id}`,
        type: 'PUBLISHED_GAP',
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: slot.booking
          ? `${slot.booking.customerName || 'Customer'} - ${slot.service.name}`
          : slot.service.name,
        color: slot.booking ? '#3b82f6' : '#10b981',
        data: {
          slotId: slot.id,
          serviceId: slot.serviceId,
          serviceName: slot.service.name,
          regularPrice: slot.regularPrice,
          dealPrice: slot.dealPrice,
          status: slot.status,
          note: slot.note,
          booking: slot.booking
        }
      })),

      ...calendarEvents.map(event => ({
        id: `event-${event.id}`,
        type: 'CALENDAR_EVENT',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        title: event.title,
        color: event.color,
        data: {
          eventId: event.id,
          eventType: event.eventType,
          customerName: event.customerName,
          customerPhone: event.customerPhone,
          description: event.description,
          location: event.location,
          notes: event.notes
        }
      })),

      ...timeBlocks.map(block => ({
        id: `block-${block.id}`,
        type: 'TIME_BLOCK',
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        title: block.title,
        color: block.color,
        data: {
          blockId: block.id,
          isRecurring: block.isRecurring,
          recurrenceRule: block.recurrenceRule,
          notes: block.notes
        }
      }))
    ];

    res.json({
      events: events.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
      vacations: vacations.map(vac => ({
        id: `vacation-${vac.id}`,
        type: 'VACATION',
        startDate: vac.startDate,
        endDate: vac.endDate,
        title: vac.title,
        color: vac.color,
        data: {
          vacationId: vac.id,
          isPublic: vac.isPublic,
          notes: vac.notes
        }
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### CRUD Endpoints

Create separate route files for each event type:

1. `calendar-events.routes.js` - CRUD for calendar events
2. `time-blocks.routes.js` - CRUD for time blocks
3. `vacations.routes.js` - CRUD for vacations

(Slots already have routes in `slot.routes.js`)

### Event Conversion Endpoint

```javascript
// POST /api/events/convert
router.post('/convert', auth(), async (req, res, next) => {
  try {
    const { eventId, fromType, toType, preserveData } = req.body;

    // Validate conversion
    const validConversions = {
      'PUBLISHED_GAP': ['CALENDAR_EVENT', 'TIME_BLOCK'],
      'CALENDAR_EVENT': ['PUBLISHED_GAP', 'TIME_BLOCK'],
      'TIME_BLOCK': ['PUBLISHED_GAP', 'CALENDAR_EVENT'],
      'VACATION': ['TIME_BLOCK']
    };

    if (!validConversions[fromType]?.includes(toType)) {
      return res.status(400).json({
        message: `Cannot convert from ${fromType} to ${toType}`
      });
    }

    // Get source event data
    const sourceData = await getEventData(eventId, fromType);

    // Create new event
    const newEvent = await createEvent(toType, sourceData, preserveData);

    // Delete source event
    await deleteEvent(eventId, fromType);

    // Log conversion
    await logActivity(sourceData.businessId, req.user.id, 'EVENT_CONVERTED', {
      from: fromType,
      to: toType,
      eventId: newEvent.id
    });

    res.json(newEvent);
  } catch (err) {
    next(err);
  }
});
```

---

## Phase 3: Frontend Components (Week 3-4)

### Component Structure

```
client/src/features/business/calendar/
├── CalendarPage.jsx           # Main page wrapper
├── CalendarToolbar.jsx        # Navigation & view controls
├── CalendarGrid.jsx           # Main calendar display
├── CalendarEvent.jsx          # Individual event component
├── DayView.jsx                # Day view layout
├── WeekView.jsx               # Week view layout
├── MonthView.jsx              # Month view layout
├── EventDetailsPanel.jsx      # Side panel for viewing/editing
├── EventCreationDialog.jsx    # Modal for creating events
├── EventConversionMenu.jsx    # Convert event type
├── hooks/
│   ├── useCalendarData.js     # Fetch calendar events
│   ├── useEventDrag.js        # Drag & drop logic
│   ├── useEventResize.js      # Resize events
│   └── useEventConversion.js  # Convert between types
├── utils/
│   ├── timeUtils.js           # Time calculations
│   ├── conflictDetection.js   # Detect overlaps
│   └── eventColors.js         # Color system
└── styles/
    └── Calendar.css           # Calendar styling
```

### Core Hook: useCalendarData

```javascript
import { useState, useEffect } from 'react';
import { api } from '../../../api';

export function useCalendarData(businessId, dateRange) {
  const [events, setEvents] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchCalendar() {
    setLoading(true);
    try {
      const data = await api(
        `/api/business/${businessId}/calendar?from=${dateRange.from}&to=${dateRange.to}`
      );
      setEvents(data.events);
      setVacations(data.vacations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCalendar();
  }, [businessId, dateRange.from, dateRange.to]);

  return {
    events,
    vacations,
    loading,
    error,
    refetch: fetchCalendar
  };
}
```

### Event Component with Color System

```javascript
function CalendarEvent({ event, onClick, onDragStart, onDragEnd }) {
  const getEventStyle = () => {
    const baseStyle = {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '13px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };

    // Type-specific styling
    switch (event.type) {
      case 'PUBLISHED_GAP':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid #059669',
          color: 'white',
          fontWeight: 600
        };

      case 'ONOVI_BOOKING':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '3px solid #1d4ed8',
          color: 'white',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
        };

      case 'CALENDAR_EVENT':
        return {
          ...baseStyle,
          background: '#f3f4f6',
          border: '2px solid #d1d5db',
          color: '#374151'
        };

      case 'TIME_BLOCK':
        return {
          ...baseStyle,
          background: 'repeating-linear-gradient(45deg, #fef3c7, #fef3c7 10px, #fde68a 10px, #fde68a 20px)',
          border: '2px dashed #f59e0b',
          color: '#92400e'
        };

      default:
        return baseStyle;
    }
  };

  return (
    <div
      style={getEventStyle()}
      onClick={() => onClick(event)}
      draggable
      onDragStart={(e) => onDragStart(e, event)}
      onDragEnd={onDragEnd}
    >
      {event.type === 'PUBLISHED_GAP' && '🟢 '}
      {event.type === 'ONOVI_BOOKING' && '🔵 '}
      {event.type === 'CALENDAR_EVENT' && '⚪ '}
      {event.type === 'TIME_BLOCK' && '🟡 '}
      {event.title}
    </div>
  );
}
```

---

## Phase 4: Interactions (Week 5-6)

### Drag & Drop

```javascript
export function useEventDrag(onEventMove, onEventCreate) {
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  function handleDragStart(e, event) {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e, targetDate, targetTime) {
    e.preventDefault();

    if (draggedEvent) {
      // Moving existing event
      onEventMove(draggedEvent, targetDate, targetTime);
    } else if (dragStart && dragEnd) {
      // Creating new event
      onEventCreate({
        date: targetDate,
        startTime: dragStart,
        endTime: dragEnd
      });
    }

    // Reset
    setDraggedEvent(null);
    setDragStart(null);
    setDragEnd(null);
  }

  return {
    handleDragStart,
    handleDrop,
    draggedEvent
  };
}
```

### Resize Events

```javascript
export function useEventResize(onEventResize) {
  const [resizingEvent, setResizingEvent] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);

  function handleResizeStart(event, direction) {
    setResizingEvent(event);
    setResizeDirection(direction); // 'top' or 'bottom'
  }

  function handleResizeMove(e, newTime) {
    if (!resizingEvent) return;

    const updatedEvent = { ...resizingEvent };

    if (resizeDirection === 'top') {
      updatedEvent.startTime = newTime;
    } else {
      updatedEvent.endTime = newTime;
    }

    // Validate
    if (updatedEvent.startTime >= updatedEvent.endTime) {
      return; // Invalid
    }

    onEventResize(updatedEvent);
  }

  return {
    handleResizeStart,
    handleResizeMove,
    resizingEvent
  };
}
```

---

## Phase 5: Views (Week 7-8)

### Day View

```javascript
function DayView({ date, events, onEventClick, onTimeSlotClick }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 9pm

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h2>{formatDate(date)}</h2>
      </div>

      <div className="time-grid">
        {hours.map(hour => (
          <div key={hour} className="hour-row">
            <div className="hour-label">{formatHour(hour)}</div>
            <div
              className="hour-slot"
              onClick={() => onTimeSlotClick(date, `${hour}:00`)}
            >
              {/* Render events for this hour */}
              {events
                .filter(e => isEventInHour(e, hour))
                .map(event => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Event creation (all types)
- [ ] Event conversion logic
- [ ] Conflict detection
- [ ] Time calculations
- [ ] Recurring event generation

### Integration Tests
- [ ] Calendar API returns all event types
- [ ] Event CRUD operations
- [ ] Conversion between types
- [ ] Vacation spanning multiple days

### E2E Tests
- [ ] Create published gap via drag
- [ ] Convert calendar event to gap
- [ ] Move event via drag & drop
- [ ] Resize event
- [ ] Delete event
- [ ] View booking details

### Manual QA
- [ ] Colors match design system
- [ ] Drag & drop feels smooth
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Events load quickly (< 1s)

---

## Deployment Checklist

- [ ] Run database migrations
- [ ] Update API documentation
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Run smoke tests in production
- [ ] Monitor error logs
- [ ] Collect user feedback

---

## Success Metrics (Week 9-10)

Track these metrics post-launch:

1. **Adoption**: % of businesses using calendar
2. **Daily Usage**: Sessions per day per business
3. **Publishing**: Gaps published per week
4. **Conversions**: Event type conversions per week
5. **Revenue Impact**: Increase in bookings

**Target**: 80% adoption within 30 days

---

## Next Steps

1. Review architecture document with team
2. Get design approval for UI mockups
3. Begin Phase 1: Database migrations
4. Set up development environment
5. Create feature branch: `feature/unified-calendar`

**Estimated Timeline**: 8-10 weeks to MVP
