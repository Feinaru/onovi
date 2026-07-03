const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Phase 1 Seed Script
 *
 * This script:
 * 1. Updates User roles from BUSINESS → SERVICE_PROVIDER
 * 2. Backfills phoneNormalized for Business and Lead
 * 3. Sets approvalStatus for existing services
 * 4. Creates ServiceProviderApproval records for existing businesses
 * 5. Seeds initial consent types
 * 6. Seeds initial application settings
 * 7. Migrates Categories → Fields with default Professions
 */

function normalizePhone(phone) {
  if (!phone) return null;
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

async function main() {
  console.log('🌱 Starting Phase 1 seeding...\n');

  // 1. Backfill publicId for existing records
  console.log('1️⃣  Backfilling publicId for existing records...');

  // Business
  const businessesWithoutPublicId = await prisma.business.findMany({
    where: { publicId: null },
    select: { id: true }
  });
  for (const business of businessesWithoutPublicId) {
    await prisma.$executeRaw`UPDATE "Business" SET public_id = gen_random_uuid() WHERE id = ${business.id}`;
  }
  console.log(`   ✅ Backfilled publicId for ${businessesWithoutPublicId.length} businesses`);

  // BusinessService (Service table)
  const servicesWithoutPublicId = await prisma.businessService.findMany({
    where: { publicId: null },
    select: { id: true }
  });
  for (const service of servicesWithoutPublicId) {
    await prisma.$executeRaw`UPDATE "Service" SET public_id = gen_random_uuid() WHERE id = ${service.id}`;
  }
  console.log(`   ✅ Backfilled publicId for ${servicesWithoutPublicId.length} services`);

  // Slot
  const slotsWithoutPublicId = await prisma.slot.findMany({
    where: { publicId: null },
    select: { id: true }
  });
  for (const slot of slotsWithoutPublicId) {
    await prisma.$executeRaw`UPDATE "Slot" SET public_id = gen_random_uuid() WHERE id = ${slot.id}`;
  }
  console.log(`   ✅ Backfilled publicId for ${slotsWithoutPublicId.length} slots`);

  // Booking
  const bookingsWithoutPublicId = await prisma.booking.findMany({
    where: { publicId: null },
    select: { id: true }
  });
  for (const booking of bookingsWithoutPublicId) {
    await prisma.$executeRaw`UPDATE "Booking" SET public_id = gen_random_uuid() WHERE id = ${booking.id}`;
  }
  console.log(`   ✅ Backfilled publicId for ${bookingsWithoutPublicId.length} bookings\n`);

  // 2. Update User roles
  console.log('2️⃣  Updating User roles...');
  const updatedUsers = await prisma.user.updateMany({
    where: { role: 'BUSINESS' },
    data: { role: 'SERVICE_PROVIDER' }
  });
  console.log(`   ✅ Updated ${updatedUsers.count} users from BUSINESS to SERVICE_PROVIDER\n`);

  // 3. Backfill phoneNormalized for Business
  console.log('3️⃣  Backfilling Business.phoneNormalized...');
  const businesses = await prisma.business.findMany({
    select: { id: true, phone: true }
  });

  let businessPhoneCount = 0;
  for (const business of businesses) {
    if (business.phone) {
      const phoneNormalized = normalizePhone(business.phone);
      await prisma.business.update({
        where: { id: business.id },
        data: { phoneNormalized }
      });
      businessPhoneCount++;
    }
  }
  console.log(`   ✅ Backfilled phoneNormalized for ${businessPhoneCount} businesses\n`);

  // 4. Backfill phoneNormalized for Lead
  console.log('4️⃣  Backfilling Lead.phoneNormalized...');
  const leads = await prisma.lead.findMany({
    select: { id: true, phone: true }
  });

  let leadPhoneCount = 0;
  for (const lead of leads) {
    if (lead.phone) {
      const phoneNormalized = normalizePhone(lead.phone);
      await prisma.lead.update({
        where: { id: lead.id },
        data: { phoneNormalized }
      });
      leadPhoneCount++;
    }
  }
  console.log(`   ✅ Backfilled phoneNormalized for ${leadPhoneCount} leads\n`);

  // 5. Set approvalStatus for existing services (grandfather them in)
  console.log('5️⃣  Setting approvalStatus for existing services...');
  const approvedServices = await prisma.businessService.updateMany({
    where: { active: true },
    data: {
      approvalStatus: 'APPROVED',
      approvedAt: new Date()
    }
  });
  console.log(`   ✅ Set ${approvedServices.count} services to APPROVED status\n`);

  // 6. Create ServiceProviderApproval records for existing businesses
  console.log('6️⃣  Creating ServiceProviderApproval records for existing businesses...');
  const allBusinesses = await prisma.business.findMany({
    select: { id: true, status: true, createdAt: true }
  });

  let approvalCount = 0;
  for (const business of allBusinesses) {
    // Check if approval record already exists
    const existing = await prisma.serviceProviderApproval.findFirst({
      where: { serviceProviderId: business.id }
    });

    if (!existing) {
      await prisma.serviceProviderApproval.create({
        data: {
          serviceProviderId: business.id,
          status: business.status === 'ACTIVE' ? 'APPROVED' : 'PENDING_APPROVAL',
          reviewedAt: business.status === 'ACTIVE' ? business.createdAt : null,
          createdAt: business.createdAt
        }
      });
      approvalCount++;
    }
  }
  console.log(`   ✅ Created ${approvalCount} ServiceProviderApproval records\n`);

  // 7. Create initial consent types
  console.log('7️⃣  Creating consent types...');
  const consentTypes = [
    {
      code: 'terms',
      titleHe: 'תנאי שימוש',
      titleEn: 'Terms of Use',
      contentHe: 'תוכן תנאי השימוש (יש לערוך מפאנל הניהול)',
      contentEn: 'Terms of Use content (edit from admin panel)',
      isMandatory: true,
      requiresScroll: true,
      version: 1,
      displayOrder: 1,
      isActive: true
    },
    {
      code: 'privacy',
      titleHe: 'מדיניות פרטיות',
      titleEn: 'Privacy Policy',
      contentHe: 'תוכן מדיניות הפרטיות (יש לערוך מפאנל הניהול)',
      contentEn: 'Privacy Policy content (edit from admin panel)',
      isMandatory: true,
      requiresScroll: true,
      version: 1,
      displayOrder: 2,
      isActive: true
    },
    {
      code: 'marketing',
      titleHe: 'דיוור שיווקי',
      titleEn: 'Marketing Emails',
      contentHe: 'אני מסכים/ה לקבל מיילים שיווקיים מ-Lomea',
      contentEn: 'I agree to receive marketing emails from Lomea',
      isMandatory: false,
      requiresScroll: false,
      version: 1,
      displayOrder: 3,
      isActive: true
    }
  ];

  let consentCount = 0;
  for (const consent of consentTypes) {
    const existing = await prisma.consentType.findUnique({
      where: { code: consent.code }
    });

    if (!existing) {
      await prisma.consentType.create({ data: consent });
      consentCount++;
    }
  }
  console.log(`   ✅ Created ${consentCount} consent types\n`);

  // 8. Create initial application settings
  console.log('8️⃣  Creating application settings...');
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (adminUser) {
    const settings = [
      {
        key: 'document_disclaimer_he',
        value: 'המסמכים המוצגים הועלו על ידי נותן השירות ונבדקו על ידי הצוות שלנו. Lomea אינה אחראית לתוכן המסמכים.',
        updatedById: adminUser.id
      },
      {
        key: 'document_disclaimer_en',
        value: 'The documents displayed were uploaded by the service provider and reviewed by our team. Lomea is not responsible for the content of the documents.',
        updatedById: adminUser.id
      }
    ];

    let settingsCount = 0;
    for (const setting of settings) {
      const existing = await prisma.applicationSetting.findUnique({
        where: { key: setting.key }
      });

      if (!existing) {
        await prisma.applicationSetting.create({ data: setting });
        settingsCount++;
      }
    }
    console.log(`   ✅ Created ${settingsCount} application settings\n`);
  } else {
    console.log(`   ⚠️  No admin user found, skipping application settings\n`);
  }

  // 9. Migrate existing Categories to Fields (1:1 mapping)
  console.log('9️⃣  Migrating Categories to Fields...');
  const categories = await prisma.category.findMany();

  let fieldCount = 0;
  let professionCount = 0;

  for (const category of categories) {
    // Check if field already exists
    const existingField = await prisma.field.findUnique({
      where: { name: category.name }
    });

    let field = existingField;

    if (!existingField) {
      field = await prisma.field.create({
        data: {
          name: category.name,
          nameHebrew: category.name, // Assuming Hebrew names, adjust if needed
          icon: category.icon,
          displayOrder: category.displayOrder,
          status: category.isActive ? 'ACTIVE' : 'ARCHIVED'
        }
      });
      fieldCount++;
    }

    // Create default profession for each field
    const existingProfession = await prisma.profession.findFirst({
      where: {
        fieldId: field.id,
        name: `${category.name} Services`
      }
    });

    if (!existingProfession) {
      await prisma.profession.create({
        data: {
          fieldId: field.id,
          name: `${category.name} Services`,
          nameHebrew: `שירותי ${category.name}`,
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });
      professionCount++;
    }
  }

  console.log(`   ✅ Created ${fieldCount} fields and ${professionCount} default professions\n`);

  console.log('✨ Phase 1 seeding complete!\n');
  console.log('Summary:');
  console.log(`  - ${updatedUsers.count} user roles updated`);
  console.log(`  - ${businessPhoneCount} business phone numbers normalized`);
  console.log(`  - ${leadPhoneCount} lead phone numbers normalized`);
  console.log(`  - ${approvedServices.count} services approved`);
  console.log(`  - ${approvalCount} approval records created`);
  console.log(`  - ${consentCount} consent types created`);
  console.log(`  - ${fieldCount} fields created from categories`);
  console.log(`  - ${professionCount} default professions created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
