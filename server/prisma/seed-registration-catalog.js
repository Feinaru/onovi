const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Registration Catalog Seed Script
 *
 * Seeds the database with realistic Israeli service catalog data:
 * - Fields (תחומים)
 * - Professions (מקצועות)
 * - Service Templates (תבניות שירות)
 * - Document Types (סוגי מסמכים)
 * - Service Document Requirements (דרישות מסמכים לשירותים)
 *
 * This seed is IDEMPOTENT - running multiple times will not create duplicates
 */

async function main() {
  console.log('🌱 Starting Registration Catalog seeding...\n');

  // ========== Document Types ==========
  console.log('1️⃣  Creating Document Types...');

  const documentTypesData = [
    {
      name: 'ID Card',
      nameHebrew: 'תעודת זהות',
      description: 'Valid Israeli ID card (both sides)',
      acceptedFormats: JSON.stringify(['PDF', 'JPG', 'PNG']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    },
    {
      name: 'Professional License',
      nameHebrew: 'רישיון מקצועי',
      description: 'Valid professional license from authorized body',
      acceptedFormats: JSON.stringify(['PDF', 'JPG', 'PNG']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    },
    {
      name: 'Business License',
      nameHebrew: 'רישיון עסק',
      description: 'Valid business license from local municipality',
      acceptedFormats: JSON.stringify(['PDF', 'JPG', 'PNG']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    },
    {
      name: 'Certificate of Incorporation',
      nameHebrew: 'תעודת התאגדות',
      description: 'Certificate of incorporation or company registration',
      acceptedFormats: JSON.stringify(['PDF']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    },
    {
      name: 'Insurance Certificate',
      nameHebrew: 'אישור ביטוח',
      description: 'Valid professional liability insurance',
      acceptedFormats: JSON.stringify(['PDF', 'JPG', 'PNG']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    },
    {
      name: 'Education Diploma',
      nameHebrew: 'תעודת השכלה',
      description: 'Diploma or certificate from recognized institution',
      acceptedFormats: JSON.stringify(['PDF', 'JPG', 'PNG']),
      maxSizeKB: 5120,
      status: 'ACTIVE'
    }
  ];

  const documentTypes = {};
  for (const docData of documentTypesData) {
    const existing = await prisma.documentType.findUnique({
      where: { name: docData.name }
    });

    if (existing) {
      documentTypes[docData.name] = existing;
    } else {
      const created = await prisma.documentType.create({ data: docData });
      documentTypes[docData.name] = created;
    }
  }
  console.log(`   ✅ Document Types ready (${Object.keys(documentTypes).length})\n`);

  // ========== Fields & Professions & Services ==========
  const catalogData = [
    {
      field: {
        name: 'Beauty & Cosmetics',
        nameHebrew: 'יופי וקוסמטיקה',
        icon: 'beauty',
        displayOrder: 1
      },
      professions: [
        {
          name: 'Cosmetology',
          nameHebrew: 'קוסמטיקה',
          displayOrder: 1,
          services: [
            { nameHebrew: 'טיפול פנים בסיסי', description: 'טיפול פנים מעמיק עם ניקוי וסרום', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'טיפול פנים מתקדם', description: 'טיפול פנים עם פילינג ומסכה', defaultDurationMinutes: 90, defaultPrice: 300, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'הסרת שיער בלייזר - פנים', description: 'הסרת שיער קבועה באמצעות לייזר', defaultDurationMinutes: 30, defaultPrice: 150, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'הסרת שיער בלייזר - גוף', description: 'הסרת שיער קבועה באזורי גוף', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'פילינג כימי', description: 'פילינג כימי לשיפור מרקם העור', defaultDurationMinutes: 45, defaultPrice: 350, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'מיקרו-נידלינג', description: 'טיפול להצערת העור', defaultDurationMinutes: 60, defaultPrice: 400, displayOrder: 6, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Nails',
          nameHebrew: 'טיפוח ציפורניים',
          displayOrder: 2,
          services: [
            { nameHebrew: 'מניקור ידיים', description: 'מניקור קלאסי עם לק רגיל', defaultDurationMinutes: 45, defaultPrice: 80, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'מניקור ג׳ל', description: 'מניקור עם לק ג׳ל עמיד', defaultDurationMinutes: 60, defaultPrice: 120, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'פדיקור', description: 'פדיקור מלא עם לק רגיל', defaultDurationMinutes: 60, defaultPrice: 100, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'פדיקור ג׳ל', description: 'פדיקור עם לק ג׳ל עמיד', defaultDurationMinutes: 75, defaultPrice: 140, displayOrder: 4, docs: ['ID Card'] },
            { nameHebrew: 'הארכת ציפורניים ג׳ל', description: 'הארכת ציפורניים בשיטת ג׳ל', defaultDurationMinutes: 90, defaultPrice: 200, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Makeup',
          nameHebrew: 'איפור',
          displayOrder: 3,
          services: [
            { nameHebrew: 'איפור ערב', description: 'איפור מלא לאירוע', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'איפור כלה', description: 'איפור כלה מלא כולל הדרכה', defaultDurationMinutes: 90, defaultPrice: 500, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'איפור קבוע - גבות', description: 'עיבוי גבות קבוע', defaultDurationMinutes: 120, defaultPrice: 1200, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'איפור קבוע - שפתיים', description: 'קונטור שפתיים קבוע', defaultDurationMinutes: 150, defaultPrice: 1500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'הדרכת איפור אישית', description: 'הדרכה אישית לאיפור יומיומי', defaultDurationMinutes: 90, defaultPrice: 300, displayOrder: 5, docs: ['ID Card'] }
          ]
        },
        {
          name: 'Eyebrows & Eyelashes',
          nameHebrew: 'גבות וריסים',
          displayOrder: 4,
          services: [
            { nameHebrew: 'עיצוב גבות', description: 'עיצוב גבות בפינצטה', defaultDurationMinutes: 30, defaultPrice: 60, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'צביעת גבות', description: 'צביעת גבות בצבע מקצועי', defaultDurationMinutes: 20, defaultPrice: 50, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'הרמת ריסים', description: 'הרמה וצביעת ריסים', defaultDurationMinutes: 60, defaultPrice: 150, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'הדבקת ריסים פרדיות', description: 'הדבקת ריסים מלאכותיות פרדיות', defaultDurationMinutes: 120, defaultPrice: 250, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'למינציה לגבות', description: 'טיפול למינציה לעיבוי גבות', defaultDurationMinutes: 45, defaultPrice: 120, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Hair Services',
        nameHebrew: 'שירותי שיער',
        icon: 'hair',
        displayOrder: 2
      },
      professions: [
        {
          name: 'Hair Styling',
          nameHebrew: 'עיצוב שיער',
          displayOrder: 1,
          services: [
            { nameHebrew: 'תספורת נשים', description: 'תספורת מקצועית לנשים', defaultDurationMinutes: 45, defaultPrice: 150, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'תספורת גברים', description: 'תספורת מקצועית לגברים', defaultDurationMinutes: 30, defaultPrice: 80, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'פן ושטיפה', description: 'פן, שטיפה ועיצוב', defaultDurationMinutes: 60, defaultPrice: 120, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'החלקת שיער קרטין', description: 'החלקה ישראלית בקרטין', defaultDurationMinutes: 180, defaultPrice: 800, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'החלקת שיער יפנית', description: 'החלקה יפנית קבועה', defaultDurationMinutes: 240, defaultPrice: 1500, displayOrder: 5, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'תסרוקת לאירוע', description: 'תסרוקת מלאה לאירוע מיוחד', defaultDurationMinutes: 90, defaultPrice: 300, displayOrder: 6, docs: ['ID Card'] }
          ]
        },
        {
          name: 'Hair Coloring',
          nameHebrew: 'צביעת שיער',
          displayOrder: 2,
          services: [
            { nameHebrew: 'צביעה מלאה', description: 'צביעת שיער מלאה בצבע אחד', defaultDurationMinutes: 120, defaultPrice: 350, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'גוונים', description: 'גוונים מלאים בשיטת פוליאז׳', defaultDurationMinutes: 180, defaultPrice: 600, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'בליאז׳', description: 'צביעת בליאז׳ מדורגת', defaultDurationMinutes: 150, defaultPrice: 500, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'שיער שיבה', description: 'כיסוי שיער שיבה', defaultDurationMinutes: 90, defaultPrice: 250, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'תיקון צבע', description: 'תיקון צבע קודם שהשתבש', defaultDurationMinutes: 180, defaultPrice: 700, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Hair Extensions',
          nameHebrew: 'תוספות שיער',
          displayOrder: 3,
          services: [
            { nameHebrew: 'תוספות שיער טבעיות - קפסולות', description: 'הדבקת תוספות שיער טבעיות בשיטת קפסולות', defaultDurationMinutes: 240, defaultPrice: 2500, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'תוספות שיער בשיטת טייפים', description: 'הדבקת תוספות עם סרטי טייפ', defaultDurationMinutes: 120, defaultPrice: 1500, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'הסרת תוספות שיער', description: 'הסרה מקצועית של תוספות', defaultDurationMinutes: 90, defaultPrice: 300, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'טיפול בתוספות שיער', description: 'טיפול והחייאת תוספות קיימות', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 4, docs: ['ID Card', 'Professional License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Massage & Wellness',
        nameHebrew: 'עיסוי ובריאות',
        icon: 'massage',
        displayOrder: 3
      },
      professions: [
        {
          name: 'Therapeutic Massage',
          nameHebrew: 'עיסוי טיפולי',
          displayOrder: 1,
          services: [
            { nameHebrew: 'עיסוי שוודי 60 דקות', description: 'עיסוי רפואי מלא לגוף', defaultDurationMinutes: 60, defaultPrice: 280, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'עיסוי שוודי 90 דקות', description: 'עיסוי רפואי ממושך לגוף', defaultDurationMinutes: 90, defaultPrice: 380, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'עיסוי ספורט', description: 'עיסוי לספורטאים ואנשים פעילים', defaultDurationMinutes: 60, defaultPrice: 300, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'עיסוי רקמות עמוק', description: 'עיסוי עמוק לשרירים מתוחים', defaultDurationMinutes: 60, defaultPrice: 320, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'עיסוי גב וכתפיים', description: 'עיסוי ממוקד לאזור העליון', defaultDurationMinutes: 30, defaultPrice: 150, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Holistic Therapy',
          nameHebrew: 'טיפול הוליסטי',
          displayOrder: 2,
          services: [
            { nameHebrew: 'עיסוי תאילנדי', description: 'עיסוי תאילנדי מסורתי', defaultDurationMinutes: 90, defaultPrice: 350, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'שיאצו יפני', description: 'עיסוי לחיצות יפני', defaultDurationMinutes: 60, defaultPrice: 300, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'רפלקסולוגיה', description: 'טיפול רפלקסולוגי לכפות הרגליים', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'ארומתרפיה', description: 'עיסוי עם שמנים אתריים', defaultDurationMinutes: 75, defaultPrice: 320, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'עיסוי אבנים חמות', description: 'עיסוי עם אבנים וולקניות חמות', defaultDurationMinutes: 90, defaultPrice: 400, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Physiotherapy',
          nameHebrew: 'פיזיותרפיה',
          displayOrder: 3,
          services: [
            { nameHebrew: 'טיפול פיזיותרפיה 45 דקות', description: 'טיפול פיזיותרפי מלא', defaultDurationMinutes: 45, defaultPrice: 280, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול פיזיותרפיה 60 דקות', description: 'טיפול פיזיותרפי מורחב', defaultDurationMinutes: 60, defaultPrice: 350, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'פיזיותרפיה ספורטיבית', description: 'טיפול לספורטאים', defaultDurationMinutes: 60, defaultPrice: 380, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'שיקום אורתופדי', description: 'שיקום לאחר פציעה או ניתוח', defaultDurationMinutes: 60, defaultPrice: 400, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Fitness & Training',
        nameHebrew: 'כושר ואימון',
        icon: 'fitness',
        displayOrder: 4
      },
      professions: [
        {
          name: 'Personal Training',
          nameHebrew: 'אימון אישי',
          displayOrder: 1,
          services: [
            { nameHebrew: 'אימון אישי 60 דקות', description: 'אימון אישי מותאם אישית', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'אימון זוגי', description: 'אימון לזוג או לחברים', defaultDurationMinutes: 60, defaultPrice: 180, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'אימון תזונה והדרכה', description: 'ייעוץ תזונתי ותכנית אימונים', defaultDurationMinutes: 90, defaultPrice: 350, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Education Diploma'] },
            { nameHebrew: 'אימון פונקציונלי', description: 'אימון פונקציונלי מתקדם', defaultDurationMinutes: 60, defaultPrice: 280, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'אימון CrossFit', description: 'אימון CrossFit קבוצתי או פרטי', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Yoga & Pilates',
          nameHebrew: 'יוגה ופילאטיס',
          displayOrder: 2,
          services: [
            { nameHebrew: 'שיעור יוגה פרטי', description: 'שיעור יוגה אישי', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'שיעור יוגה זוגי', description: 'שיעור יוגה לזוג', defaultDurationMinutes: 60, defaultPrice: 150, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'פילאטיס מכשירים', description: 'אימון פילאטיס על מכשירי Reformer', defaultDurationMinutes: 60, defaultPrice: 220, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'פילאטיס מזרן', description: 'שיעור פילאטיס על מזרן', defaultDurationMinutes: 60, defaultPrice: 180, displayOrder: 4, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'יוגה לנשים בהריון', description: 'יוגה מיוחדת לנשים בהריון', defaultDurationMinutes: 60, defaultPrice: 220, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Education Diploma'] }
          ]
        },
        {
          name: 'Dance & Movement',
          nameHebrew: 'ריקוד ותנועה',
          displayOrder: 3,
          services: [
            { nameHebrew: 'שיעור זומבה', description: 'שיעור זומבה קבוצתי', defaultDurationMinutes: 60, defaultPrice: 80, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'שיעור ריקוד מזרחי', description: 'ריקוד מזרחי לכל הגילאים', defaultDurationMinutes: 60, defaultPrice: 100, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'שיעור היפ הופ', description: 'ריקוד היפ הופ', defaultDurationMinutes: 60, defaultPrice: 100, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'ריקודי סלסה', description: 'שיעור סלסה לזוגות ויחידים', defaultDurationMinutes: 60, defaultPrice: 120, displayOrder: 4, docs: ['ID Card'] },
            { nameHebrew: 'בלט למבוגרים', description: 'שיעור בלט קלאסי', defaultDurationMinutes: 90, defaultPrice: 150, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Nutrition & Dietetics',
        nameHebrew: 'תזונה ודיאטה',
        icon: 'nutrition',
        displayOrder: 5
      },
      professions: [
        {
          name: 'Clinical Nutrition',
          nameHebrew: 'תזונה קלינית',
          displayOrder: 1,
          services: [
            { nameHebrew: 'ייעוץ תזונתי ראשוני', description: 'פגישת ייעוץ ראשונית עם תוכנית תזונה', defaultDurationMinutes: 60, defaultPrice: 350, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Education Diploma'] },
            { nameHebrew: 'מעקב תזונתי', description: 'פגישת מעקב ועדכון תוכנית', defaultDurationMinutes: 30, defaultPrice: 180, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Education Diploma'] },
            { nameHebrew: 'תזונה לירידה במשקל', description: 'תוכנית תזונה אישית לירידה במשקל', defaultDurationMinutes: 60, defaultPrice: 400, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Education Diploma'] },
            { nameHebrew: 'תזונה לספורטאים', description: 'ייעוץ תזונתי לשיפור ביצועים', defaultDurationMinutes: 60, defaultPrice: 450, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Education Diploma'] },
            { nameHebrew: 'תזונה למחלות כרוניות', description: 'ליווי תזונתי למחלות כרוניות', defaultDurationMinutes: 75, defaultPrice: 500, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Education Diploma', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Wellness Coaching',
          nameHebrew: 'אורח חיים בריא',
          displayOrder: 2,
          services: [
            { nameHebrew: 'ייעוץ תזונה ואורח חיים', description: 'ייעוץ משולב תזונה ואורח חיים', defaultDurationMinutes: 90, defaultPrice: 400, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'הדרכה לניהול משקל', description: 'הדרכה אישית לניהול משקל בריא', defaultDurationMinutes: 60, defaultPrice: 300, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'סדנת בישול בריא', description: 'סדנה קבוצתית לבישול בריא', defaultDurationMinutes: 120, defaultPrice: 250, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'ייעוץ תזונה טבעונית', description: 'ייעוץ והדרכה לתזונה טבעונית', defaultDurationMinutes: 60, defaultPrice: 350, displayOrder: 4, docs: ['ID Card', 'Professional License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Legal Services',
        nameHebrew: 'שירותים משפטיים',
        icon: 'law',
        displayOrder: 6
      },
      professions: [
        {
          name: 'Civil Law',
          nameHebrew: 'דיני ליטיגציה אזרחית',
          displayOrder: 1,
          services: [
            { nameHebrew: 'ייעוץ משפטי ראשוני', description: 'פגישת ייעוץ ראשונית עם עורך דין', defaultDurationMinutes: 60, defaultPrice: 500, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'ניסוח הסכם', description: 'ניסוח והכנת הסכם משפטי', defaultDurationMinutes: 120, defaultPrice: 1500, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'ליווי משפטי בתביעה', description: 'ליווי משפטי במשפט אזרחי', defaultDurationMinutes: 180, defaultPrice: 3000, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'בוררות ופישור', description: 'טיפול בהליכי בוררות', defaultDurationMinutes: 180, defaultPrice: 2500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Real Estate Law',
          nameHebrew: 'דיני נדל"ן',
          displayOrder: 2,
          services: [
            { nameHebrew: 'ליווי משפטי בקניית דירה', description: 'ליווי מלא בעסקת קניית נדל"ן', defaultDurationMinutes: 240, defaultPrice: 4000, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'בדיקת הסכם רכישה', description: 'בדיקה משפטית של הסכם רכישה', defaultDurationMinutes: 90, defaultPrice: 1200, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'ליווי במכירת נכס', description: 'ליווי משפטי במכירת נדל"ן', defaultDurationMinutes: 180, defaultPrice: 3500, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'ייעוץ במיסוי נדל"ן', description: 'ייעוץ משפטי במיסוי רכישה/מכירה', defaultDurationMinutes: 60, defaultPrice: 800, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Family Law',
          nameHebrew: 'דיני משפחה',
          displayOrder: 3,
          services: [
            { nameHebrew: 'ייעוץ גירושין', description: 'ייעוץ משפטי בהליכי גירושין', defaultDurationMinutes: 90, defaultPrice: 800, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'הסכם ממון', description: 'ניסוח הסכם ממון', defaultDurationMinutes: 120, defaultPrice: 2000, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'הסדר משמורת', description: 'הסדר משמורת על ילדים', defaultDurationMinutes: 180, defaultPrice: 2500, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'צוואה', description: 'ניסוח צוואה משפטית', defaultDurationMinutes: 90, defaultPrice: 1500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Accounting & Finance',
        nameHebrew: 'הנהלת חשבונות ופיננסים',
        icon: 'accounting',
        displayOrder: 7
      },
      professions: [
        {
          name: 'Bookkeeping',
          nameHebrew: 'הנהלת חשבונות',
          displayOrder: 1,
          services: [
            { nameHebrew: 'ניהול חשבונות עוסק מורשה', description: 'ניהול חשבונות חודשי לעוסק מורשה', defaultDurationMinutes: 120, defaultPrice: 800, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Business License'] },
            { nameHebrew: 'ניהול חשבונות חברה', description: 'ניהול חשבונות חודשי לחברה בע"מ', defaultDurationMinutes: 180, defaultPrice: 1500, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Business License', 'Certificate of Incorporation'] },
            { nameHebrew: 'דוחות כספיים שנתיים', description: 'הכנת דוחות כספיים שנתיים', defaultDurationMinutes: 240, defaultPrice: 3000, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Business License'] },
            { nameHebrew: 'ייעוץ מיסוי', description: 'ייעוץ במיסוי ותכנון מס', defaultDurationMinutes: 60, defaultPrice: 500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Business License'] },
            { nameHebrew: 'דוחות מס הכנסה', description: 'הגשת דוחות מס הכנסה', defaultDurationMinutes: 120, defaultPrice: 1200, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Business License'] }
          ]
        },
        {
          name: 'Tax Consulting',
          nameHebrew: 'ייעוץ מס',
          displayOrder: 2,
          services: [
            { nameHebrew: 'ייעוץ מס אישי', description: 'ייעוץ מס לפרט', defaultDurationMinutes: 60, defaultPrice: 600, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Business License'] },
            { nameHebrew: 'תכנון מס לעסק', description: 'תכנון מס שנתי לעסקים', defaultDurationMinutes: 120, defaultPrice: 2000, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Business License'] },
            { nameHebrew: 'ליווי בביקורת מס', description: 'ליווי בביקורת רשויות המס', defaultDurationMinutes: 180, defaultPrice: 3000, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Business License', 'Insurance Certificate'] },
            { nameHebrew: 'השגה על שומת מס', description: 'הגשת השגה על שומת מס', defaultDurationMinutes: 120, defaultPrice: 2500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Business License'] }
          ]
        },
        {
          name: 'Financial Consulting',
          nameHebrew: 'ייעוץ פיננסי',
          displayOrder: 3,
          services: [
            { nameHebrew: 'ייעוץ פיננסי אישי', description: 'תכנון פיננסי אישי מקיף', defaultDurationMinutes: 90, defaultPrice: 800, displayOrder: 1, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'תכנון פרישה', description: 'תכנון פיננסי לפרישה', defaultDurationMinutes: 120, defaultPrice: 1200, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'ניהול תיק השקעות', description: 'ייעוץ וניהול תיק השקעות', defaultDurationMinutes: 60, defaultPrice: 1000, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'ביטוחים ופנסיה', description: 'ייעוץ בביטוחים ופנסיה', defaultDurationMinutes: 90, defaultPrice: 600, displayOrder: 4, docs: ['ID Card', 'Professional License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Photography',
        nameHebrew: 'צילום',
        icon: 'photography',
        displayOrder: 8
      },
      professions: [
        {
          name: 'Event Photography',
          nameHebrew: 'צילום אירועים',
          displayOrder: 1,
          services: [
            { nameHebrew: 'צילום חתונה', description: 'צילום מלא של יום החתונה', defaultDurationMinutes: 480, defaultPrice: 5000, displayOrder: 1, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'צילום בת/בר מצווה', description: 'צילום אירוע בר/בת מצווה', defaultDurationMinutes: 360, defaultPrice: 3500, displayOrder: 2, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'צילום אירוע פרטי', description: 'צילום יום הולדת או אירוע משפחתי', defaultDurationMinutes: 240, defaultPrice: 2000, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'צילום אירוע עסקי', description: 'צילום כנס או אירוע עסקי', defaultDurationMinutes: 300, defaultPrice: 3000, displayOrder: 4, docs: ['ID Card', 'Business License'] }
          ]
        },
        {
          name: 'Portrait Photography',
          nameHebrew: 'צילום דיוקן',
          displayOrder: 2,
          services: [
            { nameHebrew: 'צילומי פורטרט בסטודיו', description: 'סשן צילום פורטרט בסטודיו', defaultDurationMinutes: 90, defaultPrice: 800, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'צילומי משפחה', description: 'סשן צילום משפחתי בחוץ או בסטודיו', defaultDurationMinutes: 120, defaultPrice: 1200, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'צילומי טרום לידה', description: 'צילומי היריון מקצועיים', defaultDurationMinutes: 90, defaultPrice: 900, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'צילומי ניובורן', description: 'צילום תינוקות בני מספר ימים', defaultDurationMinutes: 180, defaultPrice: 1500, displayOrder: 4, docs: ['ID Card'] },
            { nameHebrew: 'צילום עסקי פרופיל', description: 'צילום תדמית עסקית LinkedIn', defaultDurationMinutes: 60, defaultPrice: 600, displayOrder: 5, docs: ['ID Card'] }
          ]
        },
        {
          name: 'Commercial Photography',
          nameHebrew: 'צילום מסחרי',
          displayOrder: 3,
          services: [
            { nameHebrew: 'צילום מוצרים', description: 'צילום מוצרים לחנות אינטרנט', defaultDurationMinutes: 180, defaultPrice: 1800, displayOrder: 1, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'צילום נדל"ן', description: 'צילום מקצועי לנכסי נדל"ן', defaultDurationMinutes: 120, defaultPrice: 1000, displayOrder: 2, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'צילום מזון', description: 'צילום מנות למסעדות ובתי קפה', defaultDurationMinutes: 180, defaultPrice: 2000, displayOrder: 3, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'צילום אדריכלי', description: 'צילום אדריכלות ועיצוב פנים', defaultDurationMinutes: 240, defaultPrice: 2500, displayOrder: 4, docs: ['ID Card', 'Business License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Home Services',
        nameHebrew: 'שירותים לבית',
        icon: 'home',
        displayOrder: 9
      },
      professions: [
        {
          name: 'Cleaning Services',
          nameHebrew: 'שירותי ניקיון',
          displayOrder: 1,
          services: [
            { nameHebrew: 'ניקיון דירה רגיל', description: 'ניקיון יסודי של דירה', defaultDurationMinutes: 180, defaultPrice: 350, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'ניקיון דירה גדולה', description: 'ניקיון יסודי של דירה גדולה', defaultDurationMinutes: 300, defaultPrice: 550, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'ניקיון חלונות', description: 'ניקיון חלונות מקצועי', defaultDurationMinutes: 120, defaultPrice: 250, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'ניקיון אחרי שיפוץ', description: 'ניקיון מקצועי לאחר שיפוץ', defaultDurationMinutes: 360, defaultPrice: 800, displayOrder: 4, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'ניקיון עמוק', description: 'ניקיון עמוק וחיטוי כולל', defaultDurationMinutes: 240, defaultPrice: 500, displayOrder: 5, docs: ['ID Card'] }
          ]
        },
        {
          name: 'Handyman Services',
          nameHebrew: 'שירותי אחזקה',
          displayOrder: 2,
          services: [
            { nameHebrew: 'תיקון קטן בבית', description: 'תיקונים קטנים ואחזקה שוטפת', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'תליית תמונות ומדפים', description: 'תליית רהיטים ואלמנטים על הקיר', defaultDurationMinutes: 90, defaultPrice: 250, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'הרכבת רהיטים', description: 'הרכבת רהיטים מאיקאה ועוד', defaultDurationMinutes: 120, defaultPrice: 300, displayOrder: 3, docs: ['ID Card'] },
            { nameHebrew: 'תיקוני צבע קטנים', description: 'תיקוני צבע וטיח קטנים', defaultDurationMinutes: 120, defaultPrice: 350, displayOrder: 4, docs: ['ID Card'] },
            { nameHebrew: 'תיקוני חשמל בסיסיים', description: 'החלפת מפסקים, שקעים ונורות', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 5, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Gardening',
          nameHebrew: 'גינון',
          displayOrder: 3,
          services: [
            { nameHebrew: 'תחזוקת גינה חודשית', description: 'תחזוקה שוטפת של הגינה', defaultDurationMinutes: 180, defaultPrice: 400, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'גיזום עצים ושיחים', description: 'גיזום מקצועי לעצים ושיחים', defaultDurationMinutes: 240, defaultPrice: 600, displayOrder: 2, docs: ['ID Card'] },
            { nameHebrew: 'עיצוב גינה חדשה', description: 'תכנון ועיצוב גינה מאפס', defaultDurationMinutes: 480, defaultPrice: 3000, displayOrder: 3, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'השקיית גינה אוטומטית', description: 'התקנת מערכת השקיה אוטומטית', defaultDurationMinutes: 360, defaultPrice: 2500, displayOrder: 4, docs: ['ID Card', 'Business License'] }
          ]
        },
        {
          name: 'Pet Care',
          nameHebrew: 'טיפול בחיות מחמד',
          displayOrder: 4,
          services: [
            { nameHebrew: 'הטלת כלבים', description: 'הטלת כלבים 30-60 דקות', defaultDurationMinutes: 45, defaultPrice: 50, displayOrder: 1, docs: ['ID Card'] },
            { nameHebrew: 'אילוף כלבים בסיסי', description: 'שיעור אילוף פרטי בסיסי', defaultDurationMinutes: 60, defaultPrice: 200, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'אילוף כלבים מתקדם', description: 'אילוף מתקדם לכלבים', defaultDurationMinutes: 60, defaultPrice: 250, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'פנסיון לכלבים', description: 'אירוח יומי של כלבים בבית פרטי', defaultDurationMinutes: 1440, defaultPrice: 150, displayOrder: 4, docs: ['ID Card', 'Business License'] },
            { nameHebrew: 'טיפול וטרינרי ביתי', description: 'בדיקה וטרינרית בבית הלקוח', defaultDurationMinutes: 45, defaultPrice: 300, displayOrder: 5, docs: ['ID Card', 'Professional License', 'Business License'] }
          ]
        }
      ]
    },
    {
      field: {
        name: 'Medical & Wellness',
        nameHebrew: 'בריאות ורפואה',
        icon: 'medical',
        displayOrder: 10
      },
      professions: [
        {
          name: 'Alternative Medicine',
          nameHebrew: 'רפואה משלימה',
          displayOrder: 1,
          services: [
            { nameHebrew: 'טיפול אקופונקטורה', description: 'טיפול אקופונקטורה סינית', defaultDurationMinutes: 60, defaultPrice: 280, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול הומאופתיה', description: 'טיפול הומאופתי פרטני', defaultDurationMinutes: 90, defaultPrice: 350, displayOrder: 2, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'נטורופתיה', description: 'ייעוץ נטורופתי מקיף', defaultDurationMinutes: 90, defaultPrice: 400, displayOrder: 3, docs: ['ID Card', 'Professional License'] },
            { nameHebrew: 'רפואה סינית', description: 'אבחון וטיפול ברפואה סינית', defaultDurationMinutes: 75, defaultPrice: 320, displayOrder: 4, docs: ['ID Card', 'Professional License'] }
          ]
        },
        {
          name: 'Mental Health',
          nameHebrew: 'בריאות הנפש',
          displayOrder: 2,
          services: [
            { nameHebrew: 'טיפול פסיכולוגי', description: 'פגישת טיפול פסיכולוגי', defaultDurationMinutes: 50, defaultPrice: 350, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'ייעוץ זוגי', description: 'טיפול זוגי', defaultDurationMinutes: 60, defaultPrice: 450, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול משפחתי', description: 'טיפול במערכת משפחתית', defaultDurationMinutes: 75, defaultPrice: 500, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'CBT - טיפול קוגניטיבי', description: 'טיפול קוגניטיבי התנהגותי', defaultDurationMinutes: 50, defaultPrice: 380, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Speech Therapy',
          nameHebrew: 'ריפוי בדיבור',
          displayOrder: 3,
          services: [
            { nameHebrew: 'טיפול בדיבור לילדים', description: 'ריפוי בדיבור לגילאים צעירים', defaultDurationMinutes: 45, defaultPrice: 300, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול בדיבור למבוגרים', description: 'ריפוי בדיבור למבוגרים', defaultDurationMinutes: 45, defaultPrice: 320, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול בגמגום', description: 'טיפול בגמגום וליקויי דיבור', defaultDurationMinutes: 60, defaultPrice: 350, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'הערכה אבחונית', description: 'אבחון ליקויי שפה ודיבור', defaultDurationMinutes: 90, defaultPrice: 500, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        },
        {
          name: 'Occupational Therapy',
          nameHebrew: 'ריפוי בעיסוק',
          displayOrder: 4,
          services: [
            { nameHebrew: 'ריפוי בעיסוק לילדים', description: 'טיפול בעיסוק לילדים עם קשיים התפתחותיים', defaultDurationMinutes: 45, defaultPrice: 300, displayOrder: 1, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'ריפוי בעיסוק למבוגרים', description: 'טיפול שיקומי בעיסוק', defaultDurationMinutes: 45, defaultPrice: 320, displayOrder: 2, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'אבחון אינטגרציה חושית', description: 'אבחון קשיים באינטגרציה חושית', defaultDurationMinutes: 90, defaultPrice: 600, displayOrder: 3, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] },
            { nameHebrew: 'טיפול באינטגרציה חושית', description: 'טיפול בעיסוק לקשיים חושיים', defaultDurationMinutes: 60, defaultPrice: 350, displayOrder: 4, docs: ['ID Card', 'Professional License', 'Insurance Certificate'] }
          ]
        }
      ]
    }
  ];

  // ========== Seeding Catalog Data ==========
  let totalFields = 0;
  let totalProfessions = 0;
  let totalServices = 0;
  let totalRequirements = 0;

  console.log('2️⃣  Creating Fields, Professions, Service Templates, and Requirements...\n');

  for (const fieldData of catalogData) {
    // Find or create Field
    let field = await prisma.field.findUnique({
      where: { name: fieldData.field.name }
    });

    if (!field) {
      field = await prisma.field.create({
        data: {
          name: fieldData.field.name,
          nameHebrew: fieldData.field.nameHebrew,
          icon: fieldData.field.icon,
          displayOrder: fieldData.field.displayOrder,
          status: 'ACTIVE'
        }
      });
      totalFields++;
      console.log(`   ✅ Created Field: ${fieldData.field.nameHebrew}`);
    }

    // Create Professions for this Field
    for (const professionData of fieldData.professions) {
      let profession = await prisma.profession.findFirst({
        where: {
          fieldId: field.id,
          name: professionData.name
        }
      });

      if (!profession) {
        profession = await prisma.profession.create({
          data: {
            fieldId: field.id,
            name: professionData.name,
            nameHebrew: professionData.nameHebrew,
            displayOrder: professionData.displayOrder,
            status: 'ACTIVE'
          }
        });
        totalProfessions++;
        console.log(`      ✅ Created Profession: ${professionData.nameHebrew}`);
      }

      // Create Service Templates for this Profession
      for (const serviceData of professionData.services) {
        let service = await prisma.serviceTemplate.findFirst({
          where: {
            professionId: profession.id,
            nameHebrew: serviceData.nameHebrew
          }
        });

        if (!service) {
          service = await prisma.serviceTemplate.create({
            data: {
              professionId: profession.id,
              name: serviceData.nameHebrew, // English name can be same for now
              nameHebrew: serviceData.nameHebrew,
              description: serviceData.description,
              defaultDurationMinutes: serviceData.defaultDurationMinutes,
              defaultPrice: serviceData.defaultPrice,
              displayOrder: serviceData.displayOrder,
              status: 'ACTIVE'
            }
          });
          totalServices++;
        }

        // Create Document Requirements for this Service
        for (const docName of serviceData.docs) {
          const docType = documentTypes[docName];
          if (!docType) continue;

          const existingReq = await prisma.serviceDocumentRequirement.findFirst({
            where: {
              serviceTemplateId: service.id,
              documentTypeId: docType.id
            }
          });

          if (!existingReq) {
            await prisma.serviceDocumentRequirement.create({
              data: {
                serviceTemplateId: service.id,
                documentTypeId: docType.id,
                instruction: `Please upload your ${docName}`,
                instructionHebrew: `נא להעלות ${docType.nameHebrew}`,
                isMandatory: true
              }
            });
            totalRequirements++;
          }
        }
      }
    }
    console.log(''); // Empty line between fields
  }

  console.log('✨ Registration Catalog seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   Fields created: ${totalFields}`);
  console.log(`   Professions created: ${totalProfessions}`);
  console.log(`   Service Templates created: ${totalServices}`);
  console.log(`   Document Requirements created: ${totalRequirements}`);
  console.log(`   Idempotent: ✅ Yes (safe to run multiple times)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
