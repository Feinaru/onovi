# Onovi Calendar - Product Architecture

## 🎯 Product Vision

**The calendar is not just a feature. It is the main workspace for every business owner.**

Onovi should become the **daily calendar** that businesses open every morning to manage their entire working schedule. Publishing available gaps to Onovi should be a natural, effortless action within this workspace.

---

## Core Principle

> The business does NOT manage only appointments.
> The business manages its **entire working schedule**.
> Everything that happens during the day should appear in **one calendar**.

---

## 📅 Calendar Event Types

### 1. 🟢 Published Onovi Gap (Slot)

**This is NOT an appointment. It is an available time window explicitly published to Onovi.**

**Purpose**: Allow customers to book during this period.

**Database Model**:
```prisma
model Slot {
  id           Int         @id @default(autoincrement())
  businessId   Int
  serviceId    Int
  date         String      // "2026-07-01"
  startTime    String      // "14:00"
  endTime      String      // "15:00"
  regularPrice Decimal
  dealPrice    Decimal?
  status       SlotStatus  @default(OPEN)
  note         String?

  // Calendar metadata
  color        String?     @default("#10b981") // Green
  title        String?     // Optional custom title

  business Business @relation(...)
  service  Service  @relation(...)
  booking  Booking?
}

enum SlotStatus {
  OPEN       // 🟢 Available for customer booking
  RESERVED   // Temporarily held during booking flow
  BOOKED     // 🔵 Customer has booked (becomes Onovi Booking)
  CANCELLED
  EXPIRED
}
```

**Characteristics**:
- ✅ Can be created (drag to create on calendar)
- ✅ Can be edited (click to edit details)
- ✅ Can be resized (drag edges)
- ✅ Can be moved (drag to different time)
- ✅ Can be unpublished (change status or delete)
- ✅ Visible to customers when `status: OPEN`
- ✅ Can be converted to Calendar Event

**Visual Display**:
- Color: `#10b981` (Green)
- Icon: 🟢
- Border: Solid
- Label: "Published Gap" or service name
- Shows: Service name, price, deal price if set

---

### 2. 🔵 Onovi Booking

**Customer appointment booked through Onovi.**

**Purpose**: Track confirmed customer bookings from the platform.

**Database Model**:
```prisma
model Booking {
  id              Int           @id @default(autoincrement())
  slotId          Int           @unique
  customerId      Int
  status          BookingStatus
  customerPhone   String
  customerName    String?
  finalPrice      Decimal

  // Links to slot (which has date/time)
  slot     Slot     @relation(...)
  customer User     @relation(...)
  business Business @relation(...)
  service  Service  @relation(...)
}
```

**Characteristics**:
- ❌ Cannot be created directly (only via customer booking)
- ⚠️ Can be cancelled (with rules and notifications)
- ❌ Cannot be resized (time is locked to slot)
- ❌ Cannot be moved (customer booked specific time)
- ✅ Shows customer details
- ✅ Shows service and price
- ❌ Cannot be deleted without proper cancellation flow
- ⚠️ Can be marked as no-show

**Visual Display**:
- Color: `#3b82f6` (Blue)
- Icon: 🔵
- Border: Solid, thicker
- Label: Customer name + service
- Shows: Customer phone, service, price, booking ID
- Badge: "Onovi" to distinguish from other events

---

### 3. ⚪ Calendar Event

**Generic event created manually by the business.**

**This is intentionally generic because not every event is an appointment.**

**Examples**:
- Existing customer (not booked via Onovi)
- Phone booking
- WhatsApp booking
- Personal meeting
- Lunch
- Training
- Internal meeting
- Errands
- Administrative tasks

**Database Model** (NEW):
```prisma
model CalendarEvent {
  id          Int      @id @default(autoincrement())
  businessId  Int
  title       String
  description String?
  date        String   // "2026-07-01"
  startTime   String   // "14:00"
  endTime     String   // "15:00"
  color       String   @default("#9ca3af") // Gray/white
  eventType   String   @default("APPOINTMENT") // APPOINTMENT, MEETING, PERSONAL, ADMIN, OTHER

  // Optional customer reference (if it's a phone/external booking)
  customerName  String?
  customerPhone String?
  customerEmail String?

  // Metadata
  isBlocker   Boolean  @default(true)  // Blocks Onovi gaps from overlapping
  location    String?
  notes       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(...)

  @@index([businessId, date])
}
```

**Characteristics**:
- ✅ Fully editable (all fields)
- ✅ Created manually by business
- ✅ Can be resized
- ✅ Can be moved
- ✅ Can be deleted
- ✅ Blocks availability (prevents overlapping Onovi gaps)
- ❌ Never visible to customers
- ✅ Can be converted to Published Gap (if cancelled)

**Visual Display**:
- Color: `#9ca3af` (Gray/White)
- Icon: ⚪
- Border: Solid
- Label: Event title
- Shows: Title, time, customer info if present
- Subtle appearance (not as prominent as bookings)

---

### 4. 🟡 Time Block

**Dedicated non-work periods that block scheduling.**

**Examples**:
- Lunch break
- Personal time
- Coffee break
- Rest period
- Commute time

**Database Model** (NEW):
```prisma
model TimeBlock {
  id         Int      @id @default(autoincrement())
  businessId Int
  title      String
  date       String   // "2026-07-01"
  startTime  String   // "12:00"
  endTime    String   // "13:00"
  color      String   @default("#f59e0b") // Amber/yellow

  // Recurring pattern (optional)
  isRecurring Boolean  @default(false)
  recurrenceRule String? // "DAILY", "WEEKLY", "WEEKDAYS", etc.
  recurrenceEndDate String?

  notes      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(...)

  @@index([businessId, date])
}
```

**Characteristics**:
- ✅ Can be created
- ✅ Can be edited
- ✅ Can be resized
- ✅ Can be moved
- ✅ Can be deleted
- ✅ Can be recurring (daily lunch, weekly break, etc.)
- ✅ Blocks scheduling completely
- ✅ Can be converted to Published Gap (became available)
- ❌ Never visible to customers

**Visual Display**:
- Color: `#f59e0b` (Amber/Yellow)
- Icon: 🟡
- Border: Dashed
- Label: Block title (e.g., "Lunch")
- Transparent/striped pattern to show it's blocked time
- Lighter appearance than appointments

---

### 5. 🟣 Vacation

**Multi-day or single-day vacation/time off.**

**Purpose**: Block entire periods from scheduling.

**Database Model** (NEW):
```prisma
model Vacation {
  id         Int      @id @default(autoincrement())
  businessId Int
  title      String   @default("Vacation")
  startDate  String   // "2026-07-15"
  endDate    String   // "2026-07-22"
  color      String   @default("#8b5cf6") // Purple
  notes      String?

  // Business may want to mark their status
  isPublic   Boolean  @default(false) // Show "Unavailable" to customers

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(...)

  @@index([businessId, startDate, endDate])
}
```

**Characteristics**:
- ✅ Can span multiple days
- ✅ Can be created
- ✅ Can be edited
- ✅ Can be resized (change end date)
- ✅ Can be moved (change dates)
- ✅ Can be deleted
- ✅ Blocks the entire period
- ✅ Can be converted to Time Block (shortened vacation)
- ⚠️ Optionally show "Business unavailable" message to customers

**Visual Display**:
- Color: `#8b5cf6` (Purple)
- Icon: 🟣
- Border: Solid
- Label: "Vacation" or custom title
- Spans across multiple days in calendar
- Full-day event styling
- Shows date range prominently

---

## 🔄 Smart Conversion Feature

**This is a key product differentiator.**

Allow seamless conversion between compatible event types without deleting and recreating.

### Conversion Matrix

| From | To | Use Case | Business Logic |
|------|-----|----------|----------------|
| 🟢 Published Gap | ⚪ Calendar Event | Customer called by phone to book | Change status, preserve time/service info |
| 🟢 Published Gap | 🟡 Time Block | Need to block this time | Delete slot, create time block with same time |
| ⚪ Calendar Event | 🟢 Published Gap | Customer cancelled, publish the free time | Create new slot, delete calendar event |
| 🟡 Time Block | 🟢 Published Gap | Became available, want to fill the gap | Create slot, delete time block |
| 🟡 Time Block | ⚪ Calendar Event | Lunch turned into a meeting | Change type, update details |
| 🟣 Vacation | 🟡 Time Block | Shortened vacation, now just one day off | Update to single day, change type |
| 🟣 Vacation | 🟢 Published Gap | Vacation cancelled, publish the time | Create slots for the days, delete vacation |

### Conversion UI

When right-clicking or clicking "..." on any event:

```
┌─────────────────────────────┐
│ Edit Event                  │
│ Delete Event                │
├─────────────────────────────┤
│ Convert to:                 │
│  → Published Gap       🟢   │
│  → Calendar Event      ⚪   │
│  → Time Block          🟡   │
│  → Vacation            🟣   │
└─────────────────────────────┘
```

Only show compatible conversions based on current event type.

### Conversion Implementation

```typescript
// Pseudo-code for conversion logic
async function convertEvent(
  eventId: number,
  fromType: EventType,
  toType: EventType,
  preserveData: boolean = true
) {
  const sourceEvent = await getEvent(eventId, fromType);

  // Validate conversion is allowed
  if (!isConversionAllowed(fromType, toType)) {
    throw new Error('This conversion is not supported');
  }

  // Create new event with preserved data
  const newEvent = await createEvent(toType, {
    businessId: sourceEvent.businessId,
    date: sourceEvent.date,
    startTime: sourceEvent.startTime,
    endTime: sourceEvent.endTime,
    title: preserveData ? sourceEvent.title : null,
    // ... copy relevant fields
  });

  // Delete source event
  await deleteEvent(eventId, fromType);

  // Log the conversion for audit
  await logActivity('EVENT_CONVERTED', {
    from: fromType,
    to: toType,
    businessId: sourceEvent.businessId,
    eventId: newEvent.id
  });

  return newEvent;
}
```

---

## 📊 Business Calendar - The Main Workspace

### Visual Layout

The business owner sees **ALL event types together** in one unified calendar.

```
┌─────────────────────────────────────────────────────────────┐
│  Onovi Calendar - Monday, July 1, 2026          [Day] [Week] │
├─────────────────────────────────────────────────────────────┤
│ 08:00 │                                                      │
│       │                                                      │
│ 09:00 │ 🟢 Published Gap - Massage (60min) ₪180             │
│       │    Status: Available                                │
│       │                                                      │
│ 10:00 │                                                      │
│       │                                                      │
│ 11:00 │ 🔵 Onovi Booking - David Cohen                      │
│       │    Service: Haircut (30min) ₪150                    │
│       │    📱 050-1234567                                    │
│       │                                                      │
│ 12:00 │ 🟡 Lunch Break                                       │
│       │                                                      │
│ 13:00 │                                                      │
│       │                                                      │
│ 14:00 │ ⚪ Phone Booking - Sarah Levi                        │
│       │    Service: Manicure (45min)                        │
│       │    📱 052-9876543                                    │
│       │                                                      │
│ 15:00 │                                                      │
│       │                                                      │
│ 16:00 │ 🟢 Published Gap - Special Deal ₪120                │
│       │    Status: Available                                │
│       │                                                      │
│ 17:00 │                                                      │
│       │                                                      │
│ 18:00 │ ⚪ Personal Meeting                                  │
│       │                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Calendar Views

#### Day View
- Hour-by-hour breakdown (default: 7am - 9pm, customizable)
- See all events for one day
- Perfect for daily operations

#### Week View
- Monday - Sunday (or Sunday - Saturday)
- See patterns across the week
- Plan ahead

#### Month View
- Bird's eye view of the entire month
- See vacation periods
- Identify gaps to publish

### Navigation

```
┌──────────────────────────────────────────────┐
│ [←] [Today] [→]   July 2026   [Day][Week][Month] │
└──────────────────────────────────────────────┘
```

- **← / →**: Navigate previous/next period
- **Today**: Jump to current day
- **View switchers**: Toggle between Day/Week/Month

---

## 👥 Customer View - Published Gaps Only

**CRITICAL**: Customers must NEVER see the internal calendar.

### Customer Algorithm

```
Customer Available Slots =
  (Published Onovi Gaps with status: OPEN)
  MINUS
  (Onovi Bookings)
  MINUS
  (Overlapping Calendar Events where isBlocker: true)
  MINUS
  (Overlapping Time Blocks)
  MINUS
  (Overlapping Vacation periods)
```

### Customer API Response

```json
{
  "slots": [
    {
      "id": 123,
      "businessId": 1,
      "businessName": "Studio Hair",
      "serviceId": 5,
      "serviceName": "Haircut",
      "date": "2026-07-01",
      "startTime": "09:00",
      "endTime": "10:00",
      "regularPrice": 200,
      "dealPrice": 180,
      "note": "Last-minute cancellation - special price"
    }
  ]
}
```

**What customers DON'T see**:
- ❌ Calendar Events (phone bookings, meetings)
- ❌ Time Blocks (lunch, breaks)
- ❌ Vacation periods
- ❌ Booked slots
- ❌ Business working hours
- ❌ Any calculated "free time"

---

## 🎨 Visual Language - Color System

### Color Palette

| Event Type | Color Code | HEX | RGB | Usage |
|------------|------------|-----|-----|-------|
| 🟢 Published Gap | Green | `#10b981` | `rgb(16, 185, 129)` | Available money-making opportunity |
| 🔵 Onovi Booking | Blue | `#3b82f6` | `rgb(59, 130, 246)` | Confirmed revenue |
| ⚪ Calendar Event | Gray/White | `#9ca3af` | `rgb(156, 163, 175)` | Occupied time |
| 🟡 Time Block | Amber | `#f59e0b` | `rgb(245, 158, 11)` | Personal/break time |
| 🟣 Vacation | Purple | `#8b5cf6` | `rgb(139, 92, 246)` | Time off |

### Visual Indicators

Each event type should be immediately recognizable:

```css
/* Published Gap - Bright, stands out */
.event-published-gap {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #059669;
  color: white;
  font-weight: 600;
}

/* Onovi Booking - Solid, professional */
.event-onovi-booking {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 3px solid #1d4ed8;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Calendar Event - Subtle, neutral */
.event-calendar-event {
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  color: #374151;
}

/* Time Block - Dashed, clearly blocked */
.event-time-block {
  background: repeating-linear-gradient(
    45deg,
    #fef3c7,
    #fef3c7 10px,
    #fde68a 10px,
    #fde68a 20px
  );
  border: 2px dashed #f59e0b;
  color: #92400e;
}

/* Vacation - Full width, prominent */
.event-vacation {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: 2px solid #6d28d9;
  color: white;
  font-weight: 600;
  opacity: 0.9;
}
```

### At-a-Glance Understanding

A business owner should instantly understand their day:

```
09:00 🟢 → Money opportunity available
11:00 🔵 → Confirmed revenue
12:00 🟡 → My break time
14:00 ⚪ → Occupied (external booking)
16:00 🟢 → Another opportunity
```

**Color psychology**:
- Green = Go, Available, Opportunity
- Blue = Professional, Confirmed, Secure
- Gray = Neutral, Occupied
- Amber = Caution, Blocked
- Purple = Away, Unavailable

---

## 🖱️ Calendar Interactions

### Inspiration: Apple Calendar UX

The calendar should feel as natural and intuitive as Apple Calendar.

### Interaction Patterns

#### 1. Create Event - Click & Drag

```
User drags from 14:00 to 15:00
↓
System shows creation dialog:

┌──────────────────────────────┐
│ Create New Event             │
├──────────────────────────────┤
│ July 1, 2026                 │
│ 14:00 - 15:00 (1 hour)       │
├──────────────────────────────┤
│ What would you like to       │
│ create?                      │
│                              │
│ [🟢 Published Gap]           │
│ [⚪ Calendar Event]           │
│ [🟡 Time Block]              │
│ [🟣 Vacation]                │
└──────────────────────────────┘
```

#### 2. Edit Event - Click

```
User clicks on existing event
↓
Show event details in side panel or modal:

┌──────────────────────────────┐
│ 🔵 Onovi Booking             │
├──────────────────────────────┤
│ Customer: David Cohen        │
│ Phone: 050-1234567           │
│ Service: Haircut (30min)     │
│ Price: ₪150                  │
│ Date: July 1, 2026           │
│ Time: 11:00 - 11:30          │
│                              │
│ [View Booking Details]       │
│ [Contact Customer]           │
│ [Cancel Booking...]          │
└──────────────────────────────┘
```

#### 3. Resize Event - Drag Edge

```
User drags bottom edge of event
↓
System resizes event in real-time
↓
Snaps to 15-minute increments
↓
On release, validates and saves:
- Check for conflicts
- Warn if overlapping
- Update database
```

#### 4. Move Event - Drag Body

```
User drags event from 14:00 to 16:00
↓
System shows ghost/preview
↓
Validates on drop:
- Check for conflicts
- Show warning if issues
- Allow override or cancel
↓
Update event time
```

#### 5. Delete Event - Right Click

```
Right click event → Show context menu:

┌──────────────────────────────┐
│ Edit Event                   │
│ Duplicate Event              │
├──────────────────────────────┤
│ Convert to:                  │
│  → Published Gap        🟢   │
│  → Calendar Event       ⚪   │
│  → Time Block           🟡   │
├──────────────────────────────┤
│ Delete Event              ❌  │
└──────────────────────────────┘
```

#### 6. Quick Actions - Keyboard Shortcuts

```
C     - Create new event
E     - Edit selected event
D     - Duplicate selected event
Del   - Delete selected event
Cmd+Z - Undo
Cmd+Y - Redo
←→    - Navigate days
T     - Go to today
V     - Change view (Day/Week/Month)
```

### Drag & Drop Behavior

#### Smart Snapping
- Snap to 15-minute intervals by default
- Hold Shift for 5-minute precision
- Hold Alt to disable snapping

#### Conflict Detection
```
User drops event on occupied time
↓
System shows warning:

┌──────────────────────────────┐
│ ⚠️ Time Conflict              │
├──────────────────────────────┤
│ This time overlaps with:     │
│                              │
│ • 🔵 Onovi Booking (11:00)   │
│                              │
│ [Move Anyway] [Cancel]       │
└──────────────────────────────┘
```

#### Multi-Day Events
- Vacation spans across days
- Visual representation across date boundaries
- Resize by dragging end date

---

## 🏗️ Technical Architecture

### Frontend Components

```
features/business/calendar/
├── CalendarPage.jsx          # Main calendar workspace
├── CalendarView.jsx          # Calendar grid (day/week/month)
├── CalendarEvent.jsx         # Individual event component
├── EventCreationDialog.jsx   # Create new event modal
├── EventDetailsPanel.jsx     # View/edit event details
├── EventConversionMenu.jsx   # Convert between types
├── CalendarToolbar.jsx       # Navigation and view controls
├── TimeGrid.jsx              # Hour-by-hour grid
├── DayView.jsx               # Single day view
├── WeekView.jsx              # Week view
├── MonthView.jsx             # Month view
├── hooks/
│   ├── useCalendarData.js    # Fetch all events for date range
│   ├── useEventDrag.js       # Handle drag & drop
│   ├── useEventResize.js     # Handle resizing
│   └── useEventConversion.js # Handle conversions
└── utils/
    ├── timeUtils.js          # Time calculations
    ├── conflictDetection.js  # Detect overlaps
    └── colorUtils.js         # Event colors
```

### Backend API Endpoints

#### Unified Calendar Endpoint
```
GET /api/business/:businessId/calendar?from=2026-07-01&to=2026-07-31
```

Returns ALL event types in one response:

```json
{
  "events": [
    {
      "id": "slot-123",
      "type": "PUBLISHED_GAP",
      "date": "2026-07-01",
      "startTime": "09:00",
      "endTime": "10:00",
      "title": "Massage - Available",
      "color": "#10b981",
      "data": {
        "serviceId": 5,
        "serviceName": "Massage",
        "regularPrice": 200,
        "dealPrice": 180,
        "status": "OPEN"
      }
    },
    {
      "id": "booking-456",
      "type": "ONOVI_BOOKING",
      "date": "2026-07-01",
      "startTime": "11:00",
      "endTime": "11:30",
      "title": "David Cohen - Haircut",
      "color": "#3b82f6",
      "data": {
        "customerId": 78,
        "customerName": "David Cohen",
        "customerPhone": "050-1234567",
        "serviceId": 3,
        "serviceName": "Haircut",
        "price": 150,
        "status": "CONFIRMED"
      }
    },
    {
      "id": "event-789",
      "type": "CALENDAR_EVENT",
      "date": "2026-07-01",
      "startTime": "14:00",
      "endTime": "14:45",
      "title": "Phone Booking - Sarah",
      "color": "#9ca3af",
      "data": {
        "eventType": "APPOINTMENT",
        "customerName": "Sarah Levi",
        "customerPhone": "052-9876543",
        "notes": "Regular customer, booked via phone"
      }
    },
    {
      "id": "block-101",
      "type": "TIME_BLOCK",
      "date": "2026-07-01",
      "startTime": "12:00",
      "endTime": "13:00",
      "title": "Lunch Break",
      "color": "#f59e0b",
      "data": {
        "isRecurring": true,
        "recurrenceRule": "WEEKDAYS"
      }
    }
  ],
  "vacations": [
    {
      "id": "vacation-202",
      "type": "VACATION",
      "startDate": "2026-07-15",
      "endDate": "2026-07-22",
      "title": "Summer Vacation",
      "color": "#8b5cf6",
      "data": {
        "isPublic": true,
        "notes": "Family trip to Europe"
      }
    }
  ]
}
```

#### Event Management Endpoints

```
# Slots (Published Gaps)
POST   /api/slots
PATCH  /api/slots/:id
DELETE /api/slots/:id

# Calendar Events
POST   /api/calendar-events
PATCH  /api/calendar-events/:id
DELETE /api/calendar-events/:id

# Time Blocks
POST   /api/time-blocks
PATCH  /api/time-blocks/:id
DELETE /api/time-blocks/:id

# Vacations
POST   /api/vacations
PATCH  /api/vacations/:id
DELETE /api/vacations/:id

# Conversion
POST   /api/events/:id/convert
{
  "fromType": "TIME_BLOCK",
  "toType": "PUBLISHED_GAP",
  "preserveData": true
}

# Conflict Check
POST   /api/events/check-conflicts
{
  "businessId": 1,
  "date": "2026-07-01",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

### Database Schema Updates

```prisma
// Existing Slot model - no changes needed
model Slot {
  // ... existing fields
}

// NEW: Calendar Events
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

  business Business @relation(...)

  @@index([businessId, date])
}

// NEW: Time Blocks
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

  business Business @relation(...)

  @@index([businessId, date])
}

// NEW: Vacations
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

  business Business @relation(...)

  @@index([businessId, startDate, endDate])
}

// Update Business model to include new relations
model Business {
  // ... existing fields
  slots          Slot[]
  bookings       Booking[]
  calendarEvents CalendarEvent[]
  timeBlocks     TimeBlock[]
  vacations      Vacation[]
}
```

---

## 🎯 Product Goals & Success Metrics

### Primary Goal
> Make Onovi the **default daily calendar** for business owners.

### Success Metrics

1. **Daily Active Usage**
   - Business owners open Onovi calendar every morning
   - Target: 5+ sessions per day per business

2. **Publishing Behavior**
   - Average time from gap appearance to publishing: < 2 minutes
   - % of cancellations that get republished: > 70%

3. **Calendar Adoption**
   - % of businesses using calendar as primary tool: > 80%
   - % of businesses adding non-Onovi events: > 60%

4. **Conversion Usage**
   - Number of event conversions per week: > 3
   - Most common: Calendar Event → Published Gap

5. **Customer Booking Rate**
   - Increase in published gaps: +40%
   - Increase in bookings: +25%

### Why This Matters

#### Current State (Without Unified Calendar)
- Business uses external calendar (Google, Apple, paper)
- Onovi is just a "booking tool" they check occasionally
- Publishing gaps is a separate, manual task
- Low engagement, missed opportunities

#### Future State (With Unified Calendar)
- Business opens Onovi every morning (habit)
- All schedule management in one place
- Publishing gaps is natural part of day
- High engagement, maximize filled slots

### Feature Priorities

#### Phase 1: Core Calendar (MVP)
- ✅ Day view with all event types
- ✅ Create Published Gaps (drag to create)
- ✅ Create Calendar Events
- ✅ Create Time Blocks
- ✅ View Onovi Bookings
- ✅ Basic edit/delete
- ✅ Conflict detection

#### Phase 2: Enhanced Interactions
- ✅ Drag & drop to move events
- ✅ Resize events
- ✅ Week view
- ✅ Month view
- ✅ Smart conversion between types
- ✅ Keyboard shortcuts

#### Phase 3: Advanced Features
- ✅ Recurring time blocks (daily lunch, etc.)
- ✅ Multi-day vacations
- ✅ Bulk operations
- ✅ Templates (common gaps)
- ✅ Quick publish (one-click from calendar event)

#### Phase 4: Intelligence
- 🔮 Smart suggestions ("Publish this cancelled slot?")
- 🔮 Pattern detection ("You usually have gaps on Tuesday 2pm")
- 🔮 Revenue optimization ("This time slot fills faster at ₪180")
- 🔮 Calendar sync (Google Calendar integration)

---

## 🚫 Anti-Patterns to Avoid

### ❌ DON'T: Auto-Generate Availability
```javascript
// NEVER DO THIS
function autoPublishFromWorkingHours(business) {
  const workingHours = business.schedule; // 9am - 6pm
  const existingBookings = getBookings(business);

  // Calculate "free time"
  const freeSlots = workingHours.filter(hour =>
    !existingBookings.includes(hour)
  );

  // Auto-publish
  freeSlots.forEach(slot => createPublishedGap(slot));
}
```

**Why not?** This violates the opt-in principle. Businesses must explicitly choose what to publish.

### ❌ DON'T: Show Internal Calendar to Customers
```javascript
// NEVER DO THIS
function getCustomerAvailability(business) {
  const allEvents = getAllCalendarEvents(business);
  return allEvents.filter(event => event.type !== 'CALENDAR_EVENT');
}
```

**Why not?** Customers should ONLY see Published Gaps (status: OPEN).

### ❌ DON'T: Allow Customers to See "Free Time"
```
Customer: "I see you're free at 3pm"
Business: "No, I have an external appointment"
```

This breaks trust. Only show explicitly published availability.

### ❌ DON'T: Make Event Types Too Rigid
Allow conversions. Life is fluid - a time block can become a gap, a gap can become an appointment.

---

## 📱 Mobile Considerations

The calendar should work on mobile but optimized for desktop primary usage.

### Mobile Views
- Day view (default on mobile)
- Swipe to navigate days
- Tap to view event details
- Long-press for context menu
- Bottom sheet for event creation
- Simplified UI (fewer buttons)

### Desktop-First Features
- Drag & drop (harder on mobile)
- Resize events (mouse precision)
- Week/Month view (screen real estate)
- Keyboard shortcuts
- Multi-select

---

## 🔐 Security & Permissions

### Business Owner (Full Access)
- ✅ View all event types
- ✅ Create/edit/delete all events
- ✅ Publish gaps
- ✅ Cancel bookings
- ✅ Manage vacations

### Business Employee (Limited Access) [Future]
- ✅ View all events
- ✅ Create calendar events
- ✅ Create time blocks
- ⚠️ Cannot delete Onovi bookings
- ⚠️ Cannot publish gaps (requires owner approval)

### Customer (Read-Only, Filtered)
- ✅ View only: Published Gaps (status: OPEN)
- ❌ Cannot see: Calendar events, time blocks, vacations
- ❌ Cannot see: Booked slots
- ❌ Cannot see: Business schedule

---

## 📊 Analytics & Insights

Track calendar usage to improve product:

### Metrics to Track
- Events created per type per day
- Conversion frequency (type → type)
- Time to publish after cancellation
- Drag & drop usage vs. form input
- Calendar view preferences (Day/Week/Month)
- Peak publishing times
- Gap fill rate by time of day

### Business Insights (Show to Owner)
```
📊 Your Calendar Insights

This Week:
• Published 12 gaps (↑ 3 from last week)
• 8 gaps were booked (66% fill rate)
• 3 gaps converted from cancellations
• Average time to publish: 4 minutes

Best Performing:
• Tuesday 2pm - 4pm slots (100% booked)
• ₪180 price point (most bookings)
• "Last-minute deal" slots (fastest to fill)

Opportunities:
• You have gaps every Thursday at 11am
  → Consider publishing with a deal?
```

---

## 🎓 User Education

### Onboarding Flow

#### Step 1: "This is Your Calendar"
```
Show empty calendar
Text: "Welcome to your Onovi workspace. This is where you'll manage your entire day."
```

#### Step 2: "Everything in One Place"
```
Show calendar with all event types
Text: "Onovi bookings 🔵, Your appointments ⚪, Breaks 🟡, and Published gaps 🟢"
```

#### Step 3: "Publishing is Easy"
```
Animation: Drag to create → Select "Published Gap" → Published!
Text: "When you have a free slot, just drag to publish it to Onovi"
```

#### Step 4: "Smart Conversions"
```
Animation: Calendar Event → Convert → Published Gap
Text: "Customer cancelled? Convert to a published gap in one click"
```

### Tooltips & Hints

Show contextual hints:
- First drag: "Great! Drag across time to create an event"
- First publish: "Nice! This gap is now visible to customers"
- First conversion: "Excellent! You just turned a cancellation into an opportunity"

---

## 🎨 Design Mockup Descriptions

### Main Calendar View

```
┌────────────────────────────────────────────────────────────┐
│ [☰] Onovi Calendar    [Today]  [←][→]  July 2026  [Day][Week][Month] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Monday, Jul 1  Tuesday, Jul 2  Wednesday, Jul 3  ...      │
│                                                            │
│ 08:00 │          │          │                              │
│       │          │          │                              │
│ 09:00 │  🟢      │          │  🔵                          │
│       │          │          │                              │
│ 10:00 │          │  ⚪      │                              │
│       │          │          │                              │
│ 11:00 │  🔵      │          │  🟢                          │
│       │          │          │                              │
│ 12:00 │  🟡      │  🟡      │  🟡                          │
│       │          │          │                              │
│ 13:00 │          │          │                              │
│       │          │          │                              │
│ 14:00 │  ⚪      │  🟢      │                              │
│       │          │          │                              │
│ ...   │          │          │                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Event Details Panel

```
┌─────────────────────────────────┐
│ 🔵 Onovi Booking                │
├─────────────────────────────────┤
│                                 │
│ Customer Details:               │
│  Name: David Cohen              │
│  Phone: 050-1234567             │
│  Email: david@email.com         │
│                                 │
│ Booking Details:                │
│  Service: Haircut (30 min)      │
│  Date: July 1, 2026             │
│  Time: 11:00 - 11:30            │
│  Price: ₪150                    │
│  Booked: June 28, 3:45pm        │
│  Status: Confirmed              │
│                                 │
│ ┌─────────────┐ ┌─────────────┐ │
│ │ 📞 Contact  │ │ 🗓️ Details │ │
│ └─────────────┘ └─────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ Cancel Booking           │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## 🚀 Implementation Roadmap

### Week 1-2: Database & Backend
- [ ] Create migrations for new tables
- [ ] Build unified calendar API endpoint
- [ ] Implement event CRUD operations
- [ ] Add conflict detection logic
- [ ] Build conversion logic

### Week 3-4: Core UI
- [ ] Calendar grid component
- [ ] Day view
- [ ] Event rendering (all types)
- [ ] Basic click to view details
- [ ] Event creation dialog

### Week 5-6: Interactions
- [ ] Drag to create
- [ ] Drag to move
- [ ] Resize events
- [ ] Edit events
- [ ] Delete events

### Week 7-8: Advanced Features
- [ ] Week view
- [ ] Month view
- [ ] Conversion menu
- [ ] Conflict warnings
- [ ] Keyboard shortcuts

### Week 9-10: Polish & Testing
- [ ] Animations
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile optimizations
- [ ] User testing

---

## 📝 Conclusion

This calendar is not just a feature. It's a **product strategy shift**.

By making the calendar the central workspace, we create:
1. **Daily Habit**: Business owners open Onovi every morning
2. **Effortless Publishing**: Gaps are published as part of daily workflow
3. **Complete Context**: All events in one place
4. **Smart Workflows**: Convert events naturally
5. **Increased Revenue**: More published gaps = more bookings

The calendar becomes the reason businesses stay with Onovi, not just a booking tool they check occasionally.

**Next Steps**: Begin implementation starting with database schema and unified API endpoint.
