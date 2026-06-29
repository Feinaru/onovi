# Lightweight CRM - Complete Design Document

## Executive Summary

**Goal**: Create the simplest, most intelligent CRM for SMBs - learned in minutes, used daily.

**Philosophy**: The CRM manages the user, not the other way around.

**Core Principle**: Reduce friction, maximize intelligence, zero busywork.

---

## 1. Database Schema

### Lead Model
```prisma
model Lead {
  id                Int      @id @default(autoincrement())

  // Basic Info (minimal required fields)
  fullName          String
  businessName      String?
  phone             String
  email             String?

  // Official Identifier (MANDATORY)
  identifierType    IdentifierType
  identifierValue   String   @unique // Ensures no duplicates

  // Lead Tracking
  leadSource        String   // Where did they come from?
  status            LeadStatus @default(NEW)

  // Registration Connection
  businessId        Int?     @unique // Link to Business if registered
  business          Business? @relation(fields: [businessId], references: [id])

  // Follow-up System
  nextAction        String?  // "Call", "Email", "Send Proposal", etc.
  nextActionDate    DateTime?
  nextActionTime    String?  // Optional: "14:00"

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         Int      // User who created this lead
  assignedTo        Int?     // User responsible for this lead

  // Relations
  timeline          TimelineEvent[]
  notes             LeadNote[]

  @@index([identifierValue])
  @@index([status])
  @@index([nextActionDate])
  @@index([createdAt])
}

enum IdentifierType {
  ISRAELI_ID        // תעודת זהות
  COMPANY_NUMBER    // חברה בע"מ
  AUTHORIZED_DEALER // עוסק מורשה
  EXEMPT_DEALER     // עוסק פטור
}

enum LeadStatus {
  NEW
  CONTACTED
  INTERESTED
  MEETING_SCHEDULED
  PROPOSAL_SENT
  CLOSED_WON
  CLOSED_LOST
  ON_HOLD
}
```

### Timeline Event Model
```prisma
model TimelineEvent {
  id          Int      @id @default(autoincrement())
  leadId      Int
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  eventType   TimelineEventType
  title       String   // "התקשרות טלפונית", "שליחת הצעת מחיר"
  description String?  // Optional details
  metadata    Json?    // Flexible field for event-specific data

  createdAt   DateTime @default(now())
  createdBy   Int      // User who triggered this event

  @@index([leadId, createdAt])
}

enum TimelineEventType {
  LEAD_CREATED
  PHONE_CALL
  WHATSAPP_SENT
  EMAIL_SENT
  STATUS_CHANGED
  MEETING_SCHEDULED
  FOLLOW_UP_CREATED
  NOTE_ADDED
  REGISTERED
  CONVERTED_TO_CUSTOMER
}
```

### Note Model
```prisma
model LeadNote {
  id        Int      @id @default(autoincrement())
  leadId    Int
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  content   String   @db.Text

  createdAt DateTime @default(now())
  createdBy Int

  @@index([leadId, createdAt])
}
```

---

## 2. Israeli ID Validation

### Algorithm Implementation

```javascript
/**
 * Validate Israeli ID (תעודת זהות)
 * Uses official Israeli ID checksum algorithm
 */
function validateIsraeliID(id) {
  // Remove spaces and dashes
  let cleaned = id.replace(/[\s-]/g, '');

  // Pad with leading zeros to 9 digits
  cleaned = cleaned.padStart(9, '0');

  // Must be exactly 9 digits
  if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'תעודת זהות חייבת להכיל 9 ספרות',
      normalized: null
    };
  }

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleaned[i]);
    let step = digit * ((i % 2) + 1);
    sum += step > 9 ? step - 9 : step;
  }

  const isValid = sum % 10 === 0;

  return {
    valid: isValid,
    error: isValid ? null : 'מספר תעודת זהות לא תקין (בדיקת ספרת ביקורת נכשלה)',
    normalized: cleaned
  };
}

/**
 * Validate Company Number (ח.ק. / ח.פ.)
 * Must be 9 digits
 */
function validateCompanyNumber(number) {
  let cleaned = number.replace(/[\s-]/g, '');
  cleaned = cleaned.padStart(9, '0');

  if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'מספר חברה חייב להכיל 9 ספרות',
      normalized: null
    };
  }

  return {
    valid: true,
    error: null,
    normalized: cleaned
  };
}

/**
 * Master validation function
 */
function validateIdentifier(type, value) {
  switch (type) {
    case 'ISRAELI_ID':
      return validateIsraeliID(value);

    case 'COMPANY_NUMBER':
    case 'AUTHORIZED_DEALER':
    case 'EXEMPT_DEALER':
      return validateCompanyNumber(value);

    default:
      return {
        valid: false,
        error: 'סוג מזהה לא ידוע',
        normalized: null
      };
  }
}
```

---

## 3. Unique Identity System

### Duplicate Prevention

```javascript
/**
 * Check if identifier already exists
 * Before creating a new lead
 */
async function checkDuplicateIdentifier(identifierValue) {
  // Check in Leads
  const existingLead = await prisma.lead.findUnique({
    where: { identifierValue },
    include: { business: true }
  });

  if (existingLead) {
    return {
      exists: true,
      type: 'LEAD',
      record: existingLead,
      isRegistered: !!existingLead.business
    };
  }

  // Check in Businesses (direct check)
  const existingBusiness = await prisma.business.findUnique({
    where: { identifierValue }
  });

  if (existingBusiness) {
    return {
      exists: true,
      type: 'BUSINESS',
      record: existingBusiness,
      isRegistered: true
    };
  }

  return {
    exists: false,
    type: null,
    record: null,
    isRegistered: false
  };
}

/**
 * Create lead with duplicate check
 */
async function createLead(data) {
  // Validate identifier
  const validation = validateIdentifier(data.identifierType, data.identifierValue);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check for duplicates
  const duplicate = await checkDuplicateIdentifier(validation.normalized);

  if (duplicate.exists) {
    return {
      success: false,
      error: 'DUPLICATE_IDENTIFIER',
      message: duplicate.type === 'LEAD'
        ? 'ליד עם מזהה זה כבר קיים במערכת'
        : 'עסק רשום עם מזהה זה כבר קיים במערכת',
      existingRecord: duplicate.record
    };
  }

  // Create lead
  const lead = await prisma.lead.create({
    data: {
      fullName: data.fullName,
      businessName: data.businessName,
      phone: data.phone,
      email: data.email,
      identifierType: data.identifierType,
      identifierValue: validation.normalized,
      leadSource: data.leadSource,
      status: data.status || 'NEW',
      createdBy: data.userId,
      assignedTo: data.userId
    }
  });

  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      leadId: lead.id,
      eventType: 'LEAD_CREATED',
      title: 'ליד חדש נוצר',
      description: `מקור: ${data.leadSource}`,
      createdBy: data.userId
    }
  });

  // Create initial note if provided
  if (data.initialNote) {
    await prisma.leadNote.create({
      data: {
        leadId: lead.id,
        content: data.initialNote,
        createdBy: data.userId
      }
    });

    await prisma.timelineEvent.create({
      data: {
        leadId: lead.id,
        eventType: 'NOTE_ADDED',
        title: 'הערה נוספה',
        description: data.initialNote,
        createdBy: data.userId
      }
    });
  }

  return {
    success: true,
    lead: lead
  };
}
```

---

## 4. Registration Status (Auto-Calculated)

### Computed Field

```javascript
/**
 * Calculate registration status for a lead
 */
function getRegistrationStatus(lead) {
  if (lead.business) {
    return 'REGISTERED'; // Lead is connected to a registered business
  }

  return 'NOT_REGISTERED';
}

/**
 * Detect and link registered businesses
 * Run this periodically or on business registration
 */
async function linkLeadsToBusinesses() {
  // Find all leads without a linked business
  const unleadLeads = await prisma.lead.findMany({
    where: { businessId: null }
  });

  for (const lead of unleadLeads) {
    // Check if a business with same identifier registered
    const business = await prisma.business.findUnique({
      where: { identifierValue: lead.identifierValue }
    });

    if (business) {
      // Link the lead to the business
      await prisma.lead.update({
        where: { id: lead.id },
        data: { businessId: business.id }
      });

      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          leadId: lead.id,
          eventType: 'REGISTERED',
          title: 'הליד נרשם כעסק במערכת! 🎉',
          description: `העסק "${business.name}" נרשם`,
          createdBy: lead.createdBy
        }
      });

      console.log(`✅ Linked Lead #${lead.id} to Business #${business.id}`);
    }
  }
}
```

---

## 5. Main CRM Screen - Intelligent Workplace

### Smart Prioritization Algorithm

```javascript
/**
 * Get prioritized lead list
 * Sorts leads by urgency and importance
 */
async function getPrioritizedLeads(userId) {
  const now = new Date();

  const leads = await prisma.lead.findMany({
    where: {
      assignedTo: userId,
      status: {
        notIn: ['CLOSED_WON', 'CLOSED_LOST'] // Hide closed leads by default
      }
    },
    include: {
      business: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  // Calculate priority score for each lead
  const enrichedLeads = leads.map(lead => {
    const daysSinceCreation = Math.floor((now - lead.createdAt) / (1000 * 60 * 60 * 24));
    const daysSinceLastActivity = lead.timeline[0]
      ? Math.floor((now - lead.timeline[0].createdAt) / (1000 * 60 * 60 * 24))
      : daysSinceCreation;

    const isOverdue = lead.nextActionDate && lead.nextActionDate < now;
    const registrationStatus = getRegistrationStatus(lead);
    const lastNote = lead.notes[0]?.content || null;

    // Priority score calculation
    let priority = 0;

    // Overdue follow-up = CRITICAL
    if (isOverdue) priority += 1000;

    // Recently registered = HIGH
    if (registrationStatus === 'REGISTERED' && daysSinceLastActivity < 7) priority += 500;

    // New lead (< 3 days) = MEDIUM-HIGH
    if (lead.status === 'NEW' && daysSinceCreation < 3) priority += 300;

    // No activity for > 7 days = MEDIUM
    if (daysSinceLastActivity > 7 && lead.status !== 'NEW') priority += 200;

    // Follow-up coming soon (within 2 days) = MEDIUM
    if (lead.nextActionDate && !isOverdue) {
      const daysUntilAction = Math.floor((lead.nextActionDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilAction <= 2) priority += 150;
    }

    // Proposal sent (needs follow-up) = MEDIUM
    if (lead.status === 'PROPOSAL_SENT' && daysSinceLastActivity > 3) priority += 180;

    return {
      ...lead,
      daysSinceCreation,
      daysSinceLastActivity,
      isOverdue,
      registrationStatus,
      lastNote,
      priority
    };
  });

  // Sort by priority (highest first)
  enrichedLeads.sort((a, b) => b.priority - a.priority);

  return enrichedLeads;
}
```

### Smart Indicators

```javascript
/**
 * Get smart indicator for a lead
 */
function getLeadIndicator(lead) {
  if (lead.isOverdue) {
    return {
      type: 'OVERDUE',
      label: 'פעולה דחופה',
      color: 'red',
      icon: '🚨'
    };
  }

  if (lead.registrationStatus === 'REGISTERED' && lead.daysSinceLastActivity < 7) {
    return {
      type: 'REGISTERED',
      label: 'נרשם לאחרונה',
      color: 'green',
      icon: '🎉'
    };
  }

  if (lead.status === 'NEW' && lead.daysSinceCreation < 3) {
    return {
      type: 'NEW',
      label: 'ליד חדש',
      color: 'blue',
      icon: '🆕'
    };
  }

  if (lead.daysSinceLastActivity > 14) {
    return {
      type: 'INACTIVE',
      label: 'ללא פעילות',
      color: 'orange',
      icon: '⚠️'
    };
  }

  if (lead.nextActionDate) {
    const daysUntil = Math.floor((lead.nextActionDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 2 && daysUntil >= 0) {
      return {
        type: 'UPCOMING',
        label: 'פעולה קרובה',
        color: 'yellow',
        icon: '⏰'
      };
    }
  }

  return null;
}
```

---

## 6. UI/UX Design

### Main CRM Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CRM - לידים                                    🔍 [חיפוש]  ➕ ליד חדש │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 הלידים שלי (12)        📊 מצב תעדוף        📅 היום         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🚨 דורשים תשומת לב (3)                                         │
├─────────────────────────────────────────────────────────────────┤
│  🔴 יוסי כהן             050-1234567    טלפון    התקשר היום!   │
│     מעוניין במסעדה      [התקשר] [WhatsApp] [הערה]     לפני 2 שבועות │
│                                                                 │
│  🟡 שרה לוי              054-9876543    אתר      שלח הצעה       │
│     פגישה עם כל הצוות    [התקשר] [WhatsApp] [הערה]     לפני שבוע    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🆕 לידים חדשים (4)                                             │
├─────────────────────────────────────────────────────────────────┤
│  🔵 דוד מזרחי           052-5555555    המלצה    חדש             │
│     מספרה              [התקשר] [WhatsApp] [הערה]     היום       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📊 בתהליך (5)                                                  │
├─────────────────────────────────────────────────────────────────┤
│  🟢 רחל אברהם           050-1111111    נרשם!    תקופת ניסיון   │
│     קפה                [פתח עסק] [הערה]        אתמול         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lead Card - Minimal Info Only

```
┌──────────────────────────────────────────────────────┐
│ 🚨 יוסי כהן                          050-1234567     │
│    מסעדת "טעים בקרית אתא"                            │
│                                                      │
│ 📍 מעוניין | פעולה הבאה: התקשר היום!               │
│ 🆔 *****4567 (ח.פ.) | מקור: טלפון נכנס              │
│ 📅 נוצר לפני 14 ימים | פעילות אחרונה: לפני 7 ימים   │
│                                                      │
│ [📞 התקשר] [💬 WhatsApp] [✉️ אימייל] [🗓️ פגישה] [📝 הערה] │
└──────────────────────────────────────────────────────┘
```

---

## 7. Quick Actions System

### One-Click Actions

```javascript
/**
 * Quick action: Phone call
 */
async function quickActionPhoneCall(leadId, userId, note = null) {
  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      leadId,
      eventType: 'PHONE_CALL',
      title: 'שיחת טלפון',
      description: note,
      createdBy: userId
    }
  });

  // Update lead timestamp
  await prisma.lead.update({
    where: { id: leadId },
    data: { updatedAt: new Date() }
  });

  return { success: true };
}

/**
 * Quick action: WhatsApp sent
 */
async function quickActionWhatsApp(leadId, userId, message = null) {
  await prisma.timelineEvent.create({
    data: {
      leadId,
      eventType: 'WHATSAPP_SENT',
      title: 'הודעת WhatsApp נשלחה',
      description: message,
      createdBy: userId
    }
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { updatedAt: new Date() }
  });

  return { success: true };
}

/**
 * Quick action: Set follow-up
 */
async function quickActionSetFollowUp(leadId, userId, action, date, time = null) {
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      nextAction: action,
      nextActionDate: date,
      nextActionTime: time,
      updatedAt: new Date()
    }
  });

  await prisma.timelineEvent.create({
    data: {
      leadId,
      eventType: 'FOLLOW_UP_CREATED',
      title: 'תזכורת נקבעה',
      description: `${action} ב-${date.toLocaleDateString('he-IL')}${time ? ` ב-${time}` : ''}`,
      createdBy: userId
    }
  });

  return { success: true };
}

/**
 * Quick action: Add note
 */
async function quickActionAddNote(leadId, userId, content) {
  const note = await prisma.leadNote.create({
    data: {
      leadId,
      content,
      createdBy: userId
    }
  });

  await prisma.timelineEvent.create({
    data: {
      leadId,
      eventType: 'NOTE_ADDED',
      title: 'הערה נוספה',
      description: content,
      createdBy: userId
    }
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { updatedAt: new Date() }
  });

  return { success: true, note };
}
```

---

## 8. Timeline UI

### Chat-Style Timeline

```
┌──────────────────────────────────────────────────────┐
│  Timeline - יוסי כהן                          [חזור]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│                                       📝 היום, 14:32 │
│                      הערה: "העסק מעוניין בתוכנית       │
│                       פרימיום. לשלוח הצעת מחיר"      │
│                                                      │
│  📞 אתמול, 10:15                                      │
│  שיחת טלפון                                          │
│  "דיברנו על מחירים"                                 │
│                                                      │
│                                  💬 לפני 3 ימים, 16:00 │
│                                    הודעת WhatsApp נשלחה │
│                                "שלחתי קישור להרשמה"   │
│                                                      │
│  ⏰ לפני שבוע, 11:00                                  │
│  תזכורת נקבעה                                        │
│  "להתקשר השבוע"                                      │
│                                                      │
│  🆕 לפני 14 ימים                                     │
│  ליד חדש נוצר                                        │
│  מקור: טלפון נכנס                                    │
│                                                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  💬 הוסף הערה מהירה...            [שלח]      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 9. Privacy & Security

### Masked Identifier Display

```javascript
/**
 * Mask Israeli ID for display
 * Shows only last 4 digits
 */
function maskIdentifier(identifierType, identifierValue) {
  if (identifierType === 'ISRAELI_ID') {
    const last4 = identifierValue.slice(-4);
    return `*****${last4}`;
  }

  // For company numbers, show last 5 digits
  const last5 = identifierValue.slice(-5);
  return `****${last5}`;
}

/**
 * Check if user has permission to view full identifier
 */
function canViewFullIdentifier(user) {
  return user.role === 'ADMIN' || user.role === 'MANAGER';
}

/**
 * Get identifier for display
 */
function getDisplayIdentifier(lead, user) {
  if (canViewFullIdentifier(user)) {
    return {
      value: lead.identifierValue,
      masked: false,
      canReveal: false
    };
  }

  return {
    value: maskIdentifier(lead.identifierType, lead.identifierValue),
    masked: true,
    canReveal: true
  };
}
```

---

## 10. Design System

### Color Palette

```css
/* Status Colors */
--status-new: #3B82F6;        /* Blue */
--status-contacted: #8B5CF6;   /* Purple */
--status-interested: #06B6D4;  /* Cyan */
--status-meeting: #F59E0B;     /* Amber */
--status-proposal: #10B981;    /* Green */
--status-won: #22C55E;         /* Bright Green */
--status-lost: #EF4444;        /* Red */

/* Priority Indicators */
--priority-critical: #DC2626;  /* Red */
--priority-high: #F59E0B;      /* Orange */
--priority-medium: #3B82F6;    /* Blue */
--priority-low: #6B7280;       /* Gray */

/* Background */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;
--bg-hover: #F3F4F6;

/* Text */
--text-primary: #111827;
--text-secondary: #6B7280;
--text-disabled: #9CA3AF;

/* Borders */
--border-light: #E5E7EB;
--border-medium: #D1D5DB;
```

### Typography

```css
/* Headers */
.crm-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.crm-section-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

/* Body */
.crm-lead-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.crm-lead-detail {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* Timeline */
.crm-timeline-title {
  font-size: 15px;
  font-weight: 500;
}

.crm-timeline-time {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}
```

---

## 11. Critical UX Patterns

### 1. Zero-State Experience

When CRM is empty:
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                      🎯                              │
│                                                      │
│            עדיין אין לידים במערכת                     │
│                                                      │
│        הוסף את הליד הראשון שלך ותתחיל לעבוד          │
│                                                      │
│               [➕ צור ליד חדש]                        │
│                                                      │
│         או: ייבא לידים מקובץ Excel                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2. Duplicate Detection Flow

```
┌──────────────────────────────────────────────────────┐
│  ⚠️ ליד כבר קיים                                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  מזהה זה כבר קיים במערכת:                           │
│                                                      │
│  📋 יוסי כהן - 050-1234567                           │
│  🏢 מסעדה בקרית אתא                                  │
│  📅 נוצר: 12/05/2026                                 │
│  📍 סטטוס: מעוניין                                   │
│                                                      │
│  [פתח ליד קיים]              [ביטול]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 3. Quick Add Modal

```
┌──────────────────────────────────────────────────────┐
│  ליד חדש                                      [✕]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📝 שם / שם עסק *                                    │
│  [_____________________________________________]     │
│                                                      │
│  📞 טלפון *                                          │
│  [050-_______________________________________]       │
│                                                      │
│  🆔 מזהה רשמי *          [סוג המזהה ▼]             │
│  [___________________]   תעודת זהות                 │
│                                                      │
│  📍 מקור *                                           │
│  [טלפון נכנס ▼]                                     │
│                                                      │
│  💬 הערה ראשונית (לא חובה)                          │
│  [_____________________________________________]     │
│  [_____________________________________________]     │
│                                                      │
│              [ביטול]        [צור ליד]               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 12. Mobile-First Design

### Mobile CRM View

```
┌─────────────────────────┐
│ 🎯 CRM      🔍  ➕      │
├─────────────────────────┤
│                         │
│ 🚨 דחוף (2)            │
│                         │
│ 🔴 יוסי כהן           │
│ 050-1234567            │
│ התקשר היום!            │
│ לפני 14 ימים           │
│ [📞] [💬] [📝]         │
│                         │
│ 🟡 שרה לוי             │
│ 054-9876543            │
│ שלח הצעה               │
│ לפני 7 ימים            │
│ [📞] [💬] [📝]         │
│                         │
├─────────────────────────┤
│ 🆕 חדשים (3)           │
├─────────────────────────┤
│                         │
│ 🔵 דוד מזרחי           │
│ 052-5555555            │
│ חדש                    │
│ היום                   │
│ [📞] [💬] [📝]         │
│                         │
└─────────────────────────┘
```

---

## 13. Implementation Priorities

### Phase 1: MVP (Week 1-2)
- ✅ Database schema
- ✅ Lead creation with validation
- ✅ Duplicate detection
- ✅ Basic CRM list
- ✅ Timeline (read-only)
- ✅ Quick actions (call, WhatsApp, note)

### Phase 2: Intelligence (Week 3-4)
- ✅ Smart prioritization
- ✅ Auto-detect registrations
- ✅ Follow-up system
- ✅ Smart indicators
- ✅ Search & filters

### Phase 3: Polish (Week 5-6)
- ✅ Mobile optimization
- ✅ Keyboard shortcuts
- ✅ Bulk actions
- ✅ Export/Import
- ✅ Advanced permissions

---

## 14. Success Metrics

### User Metrics
- Time to create first lead: < 60 seconds
- Time to find a lead: < 5 seconds
- Actions per lead per day: > 2
- Daily active usage: > 80% of sales team

### Business Metrics
- Lead → Customer conversion rate
- Average lead lifecycle time
- Follow-up completion rate
- Response time to new leads

---

## 15. Key Differentiators

### vs. Salesforce
- ✅ 10x simpler
- ✅ No training needed
- ✅ Mobile-first
- ✅ Zero configuration

### vs. HubSpot
- ✅ Faster
- ✅ Cleaner UI
- ✅ Better for Hebrew
- ✅ Integrated with marketplace

### vs. Google Sheets
- ✅ Automated timeline
- ✅ Smart prioritization
- ✅ Duplicate prevention
- ✅ Registration detection

---

**This is not just a CRM.**

**This is an intelligent sales assistant that happens to store data.**

