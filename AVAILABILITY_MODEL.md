# Onovi Availability Model - Critical Business Rule

## ⚠️ IMPORTANT: Opt-In Availability Model

**This is a fundamental product requirement that must not be violated.**

## Core Principle

Onovi is a **gap-filling platform**, not a general booking platform.

### Customer Availability = Explicitly Published Slots ONLY

Customers should **NEVER** see:
- ❌ Business working hours
- ❌ General "free time" calculated from calendar
- ❌ Time slots generated from business availability minus bookings
- ❌ External appointments (Google Calendar, etc.)

Customers should **ONLY** see:
- ✅ Slots explicitly published to Onovi by the business
- ✅ With status: `OPEN` (available for booking)

### Formula for Customer Visibility

```
Customer Available Slots =
  Published Onovi Slots (status: OPEN)
  MINUS Existing Onovi Bookings
```

**External appointments are blockers only - they do NOT create availability.**

---

## Implementation Details

### Database Schema

```prisma
enum SlotStatus {
  OPEN       // Visible to customers - available for booking
  RESERVED   // Temporarily held during booking flow
  BOOKED     // Customer has booked this slot
  CANCELLED  // Slot was cancelled
  EXPIRED    // Slot date/time has passed
}

model Slot {
  id           Int
  businessId   Int
  serviceId    Int
  date         String       // e.g., "2026-06-30"
  startTime    String       // e.g., "14:00"
  endTime      String       // e.g., "15:00"
  regularPrice Decimal
  dealPrice    Decimal?
  status       SlotStatus   @default(OPEN)
  note         String?

  // Relations
  business Business
  service  Service
  booking  Booking?
}
```

### API Endpoints

#### `GET /slots` - Customer Slot Discovery

**CRITICAL**: This endpoint must ONLY return `status: OPEN` slots.

```javascript
// ✅ CORRECT Implementation (current)
const where = { status: 'OPEN' };
if (date) where.date = date;
if (cityCode) where.business = { cityCode: Number(cityCode) };
if (categoryId) where.business.categoryId = Number(categoryId);

const slots = await prisma.slot.findMany({ where });
```

```javascript
// ❌ WRONG - Do NOT implement
// Never calculate availability from working hours
const freeSlots = calculateFromWorkingHours(business.workingHours)
  .filter(slot => !hasBooking(slot) && !hasExternalAppointment(slot));
```

#### `POST /slots` - Business Creates Slot

**Only the business owner can create slots.**

This is an **explicit opt-in action** where the business:
1. Chooses a specific date and time window
2. Sets pricing (regular price + optional deal price)
3. Publishes it to Onovi

```javascript
// Business explicitly creates a slot
POST /slots
{
  "businessId": 1,
  "serviceId": 2,
  "date": "2026-07-01",
  "startTime": "14:00",
  "endTime": "15:00",
  "regularPrice": 250,
  "dealPrice": 180,
  "note": "Last-minute cancellation - discount available"
}
```

---

## Business Calendar vs Customer View

### Business Calendar (Internal View)
The business owner should see:
- ✅ Published Onovi slots (all statuses)
- ✅ Onovi bookings
- ✅ External appointments (from Google Calendar, etc.)
- ✅ Full schedule with all time blocks

**Purpose**: Business needs full context to manage their schedule.

### Customer View (Public)
Customers should see:
- ✅ **ONLY** published Onovi slots with `status: OPEN`
- ❌ No external appointments
- ❌ No working hours
- ❌ No "calculated" availability

**Purpose**: Customers fill explicitly published gaps.

---

## External Calendar Integration

When integrating with Google Calendar or other external calendars:

### Import Flow (External → Onovi)

**External appointments are BLOCKERS only:**

```javascript
// ❌ WRONG - Do NOT create slots from external appointments
externalAppointments.forEach(apt => {
  createSlot({ date: apt.date, startTime: apt.start, endTime: apt.end });
});

// ✅ CORRECT - Use external appointments to validate/warn only
function canPublishSlot(proposedSlot, externalAppointments) {
  const hasConflict = externalAppointments.some(apt =>
    overlaps(proposedSlot, apt)
  );

  if (hasConflict) {
    return {
      allowed: true, // Business can still publish if they want
      warning: "⚠️ This overlaps with an external appointment"
    };
  }

  return { allowed: true };
}
```

### Export Flow (Onovi → External)

**Onovi bookings should sync TO external calendars:**

```javascript
// ✅ When a customer books a slot
onBookingCreated(booking => {
  // Create event in Google Calendar
  googleCalendar.createEvent({
    summary: `Onovi - ${booking.service.name}`,
    start: `${booking.date}T${booking.startTime}`,
    end: `${booking.date}T${booking.endTime}`,
    description: `Customer: ${booking.customer.name}`
  });
});
```

---

## Frontend Implementation

### Customer Slot Search

```javascript
// ✅ CORRECT - Only fetch OPEN slots
const slots = await api('/slots', {
  cityCode: selectedCity,
  categoryId: selectedCategory,
  date: selectedDate
  // Backend automatically filters status: OPEN
});
```

### Business Slot Management

```javascript
// ✅ Business explicitly creates slots
function publishSlot(slotData) {
  return api('/slots', {
    method: 'POST',
    body: JSON.stringify({
      businessId: business.id,
      serviceId: slotData.serviceId,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      regularPrice: slotData.regularPrice,
      dealPrice: slotData.dealPrice, // Optional discount
      note: slotData.note // e.g., "Cancellation - available now!"
    })
  });
}
```

---

## Testing Checklist

### ✅ Verify Customer View
- [ ] Customer sees only explicitly published slots
- [ ] Customer cannot see business working hours
- [ ] Customer cannot see external appointments
- [ ] Customer cannot see BOOKED/CANCELLED/EXPIRED slots
- [ ] Only `status: OPEN` slots appear in search results

### ✅ Verify Business View
- [ ] Business can create slots manually
- [ ] Business sees all their slots (all statuses)
- [ ] Business can see external appointments (if integrated)
- [ ] Business gets warnings about conflicts (but can still publish)

### ❌ Never Allow
- [ ] Auto-generation of slots from working hours
- [ ] Customers seeing "calculated" availability
- [ ] External appointments creating public availability
- [ ] Slots appearing without explicit business action

---

## Migration Notes

If you're ever tempted to add features like:
- "Sync my Google Calendar working hours"
- "Auto-publish slots from my schedule"
- "Show my general availability"

**STOP and remember:**

Onovi is about **filling gaps**, not managing full schedules.

The business must **explicitly choose** each time slot to publish. This is the core value proposition:
- Business has last-minute cancellation → Publishes to Onovi with discount
- Business has an unexpected gap → Publishes to Onovi
- Business wants to fill slow hours → Publishes specific slots

---

## Questions & Answers

**Q: Why not calculate availability from working hours?**
A: This would turn Onovi into a general booking platform. Our product is specifically for filling gaps, not full schedule management.

**Q: Why can't external appointments create slots automatically?**
A: External appointments are the business's regular schedule. Onovi slots are explicitly chosen gaps/opportunities.

**Q: What if a business wants to publish many slots at once?**
A: That's fine - they can bulk-create slots. The key is they're **explicitly creating each one**, not auto-generating from calendar.

**Q: Can we add a "quick publish" feature that suggests slots?**
A: Yes, but only as **suggestions** that require explicit confirmation. Never auto-publish.

---

## Contact

If you have questions about this model or need to implement calendar features, please discuss with the product team **before** implementation.

This is a core product differentiator and must be preserved.
