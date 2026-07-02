const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Verification Script for Registration Catalog
 *
 * Verifies:
 * - Actual counts of all entities
 * - Data integrity (no orphans)
 * - Referential integrity
 * - Active status distribution
 */

async function main() {
  console.log('🔍 Verifying Registration Catalog Data...\n');

  // ========== Count Statistics ==========
  console.log('📊 DATABASE COUNTS:\n');

  const totalFields = await prisma.field.count();
  const activeFields = await prisma.field.count({ where: { status: 'ACTIVE' } });
  console.log(`Fields: ${totalFields}`);
  console.log(`Active Fields: ${activeFields}\n`);

  const totalProfessions = await prisma.profession.count();
  const activeProfessions = await prisma.profession.count({ where: { status: 'ACTIVE' } });
  console.log(`Professions: ${totalProfessions}`);
  console.log(`Active Professions: ${activeProfessions}\n`);

  const totalServiceTemplates = await prisma.serviceTemplate.count();
  const activeServiceTemplates = await prisma.serviceTemplate.count({ where: { status: 'ACTIVE' } });
  console.log(`Service Templates: ${totalServiceTemplates}`);
  console.log(`Active Service Templates: ${activeServiceTemplates}\n`);

  const totalDocumentTypes = await prisma.documentType.count();
  const activeDocumentTypes = await prisma.documentType.count({ where: { status: 'ACTIVE' } });
  console.log(`Document Types: ${totalDocumentTypes}`);
  console.log(`Active Document Types: ${activeDocumentTypes}\n`);

  const totalDocumentRequirements = await prisma.serviceDocumentRequirement.count();
  console.log(`Document Requirements: ${totalDocumentRequirements}\n`);

  // ========== Integrity Checks ==========
  console.log('🔐 INTEGRITY CHECKS:\n');

  // Check 1: Every Profession belongs to a Field (check via join)
  const allProfessions = await prisma.profession.findMany({
    include: {
      field: true
    }
  });
  const professionsWithoutField = allProfessions.filter(p => !p.field);
  console.log(`✅ Professions without Field: ${professionsWithoutField.length}`);

  // Check 2: Every Service Template belongs to exactly one Profession
  const allServices = await prisma.serviceTemplate.findMany({
    include: {
      profession: true
    }
  });
  const servicesWithoutProfession = allServices.filter(s => !s.profession);
  console.log(`✅ Service Templates without Profession: ${servicesWithoutProfession.length}`);

  // Check 3: Every DocumentRequirement references valid entities
  const allRequirements = await prisma.serviceDocumentRequirement.findMany({
    include: {
      serviceTemplate: true,
      documentType: true
    }
  });
  const requirementsWithInvalidService = allRequirements.filter(r => !r.serviceTemplate).length;
  const requirementsWithInvalidDocType = allRequirements.filter(r => !r.documentType).length;
  console.log(`✅ Requirements with invalid Service Template: ${requirementsWithInvalidService}`);
  console.log(`✅ Requirements with invalid Document Type: ${requirementsWithInvalidDocType}`);

  // Check 4: Verify all relationships work
  const fieldsWithProfessions = await prisma.field.findMany({
    include: {
      _count: {
        select: { professions: true }
      }
    }
  });

  console.log(`\n📋 FIELD → PROFESSION HIERARCHY:\n`);
  for (const field of fieldsWithProfessions) {
    console.log(`   ${field.nameHebrew}: ${field._count.professions} professions`);
  }

  const professionsWithServices = await prisma.profession.findMany({
    include: {
      _count: {
        select: { serviceTemplates: true }
      }
    }
  });

  console.log(`\n📋 PROFESSION → SERVICE TEMPLATE BREAKDOWN:\n`);
  for (const profession of professionsWithServices) {
    console.log(`   ${profession.nameHebrew}: ${profession._count.serviceTemplates} services`);
  }

  // Check 5: Document requirement distribution
  const servicesWithRequirements = await prisma.serviceTemplate.findMany({
    include: {
      _count: {
        select: { documentRequirements: true }
      }
    },
    where: {
      documentRequirements: {
        some: {}
      }
    }
  });

  console.log(`\n📋 DOCUMENT REQUIREMENTS DISTRIBUTION:\n`);
  const requirementCounts = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4+': 0
  };

  for (const service of servicesWithRequirements) {
    const count = service._count.documentRequirements;
    if (count === 1) requirementCounts['1']++;
    else if (count === 2) requirementCounts['2']++;
    else if (count === 3) requirementCounts['3']++;
    else requirementCounts['4+']++;
  }

  console.log(`   Services requiring 1 document: ${requirementCounts['1']}`);
  console.log(`   Services requiring 2 documents: ${requirementCounts['2']}`);
  console.log(`   Services requiring 3 documents: ${requirementCounts['3']}`);
  console.log(`   Services requiring 4+ documents: ${requirementCounts['4+']}`);

  // Sample services with different document requirements
  console.log(`\n📋 SAMPLE SERVICES BY DOCUMENT REQUIREMENT:\n`);

  const serviceWith1Doc = await prisma.serviceTemplate.findFirst({
    where: {
      documentRequirements: {
        some: {}
      }
    },
    include: {
      documentRequirements: {
        include: {
          documentType: true
        }
      }
    }
  });

  if (serviceWith1Doc && serviceWith1Doc.documentRequirements.length === 1) {
    console.log(`   Service requiring only ID:`);
    console.log(`      ${serviceWith1Doc.nameHebrew}`);
    console.log(`      Requires: ${serviceWith1Doc.documentRequirements.map(r => r.documentType.nameHebrew).join(', ')}`);
  }

  const serviceWithMultipleDocs = await prisma.serviceTemplate.findFirst({
    where: {
      documentRequirements: {
        some: {}
      }
    },
    include: {
      documentRequirements: {
        include: {
          documentType: true
        }
      }
    },
    orderBy: {
      documentRequirements: {
        _count: 'desc'
      }
    }
  });

  if (serviceWithMultipleDocs && serviceWithMultipleDocs.documentRequirements.length > 1) {
    console.log(`\n   Service requiring multiple documents:`);
    console.log(`      ${serviceWithMultipleDocs.nameHebrew}`);
    console.log(`      Requires: ${serviceWithMultipleDocs.documentRequirements.map(r => r.documentType.nameHebrew).join(', ')}`);
  }

  // ========== Final Summary ==========
  console.log('\n✨ VERIFICATION COMPLETE!\n');

  const allChecksPass =
    professionsWithoutField.length === 0 &&
    servicesWithoutProfession.length === 0 &&
    requirementsWithInvalidService === 0 &&
    requirementsWithInvalidDocType === 0;

  if (allChecksPass) {
    console.log('✅ ALL INTEGRITY CHECKS PASSED');
  } else {
    console.log('❌ SOME INTEGRITY CHECKS FAILED');
    process.exit(1);
  }

  console.log('\n📦 READY FOR END-TO-END TESTING');
  console.log('   The registration catalog is fully seeded and verified.');
  console.log('   You can now test the complete registration flow.\n');
}

main()
  .catch((e) => {
    console.error('❌ Verification error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
