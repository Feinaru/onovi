const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SYSTEM_TAGS = [
  { name: 'VIP', color: '#FFD700', description: 'לקוח VIP', isSystem: true },
  { name: 'פיילוט', color: '#3B82F6', description: 'משתמש פיילוט', isSystem: true },
  { name: 'פרימיום', color: '#8B5CF6', description: 'מנוי פרימיום', isSystem: true },
  { name: 'מאומת', color: '#10B981', description: 'אומת על ידי המערכת', isSystem: true },
  { name: 'דורש מעקב', color: '#F59E0B', description: 'דורש תשומת לב', isSystem: true },
  { name: 'בעייתי', color: '#EF4444', description: 'משתמש בעייתי', isSystem: true },
  { name: 'חסר מידע', color: '#6B7280', description: 'פרופיל לא שלם', isSystem: true },
  { name: 'מוכן לפרסום', color: '#059669', description: 'עסק מוכן לפרסום', isSystem: true }
];

async function seedUserTags() {
  console.log('🏷️  Seeding user tags...');

  for (const tag of SYSTEM_TAGS) {
    const existing = await prisma.userTag.findUnique({
      where: { name: tag.name }
    });

    if (!existing) {
      await prisma.userTag.create({
        data: tag
      });
      console.log(`✅ Created tag: ${tag.name}`);
    } else {
      console.log(`⏭️  Tag already exists: ${tag.name}`);
    }
  }

  console.log('✨ User tags seeded successfully!');
}

seedUserTags()
  .catch((e) => {
    console.error('❌ Error seeding user tags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
