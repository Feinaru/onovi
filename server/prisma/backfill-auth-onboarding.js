/**
 * Phase 1 backfill — auth identities + onboarding metadata.
 *
 * Idempotent and additive-only:
 *  - Ensures each existing User has one AuthIdentity(provider=PASSWORD) mirroring User.passwordHash.
 *  - Sets User.onboardingStatus = COMPLETED (existing users are already using the app).
 *  - Sets User.onboardingType from the current role (WITHOUT changing User.role).
 *
 * Does NOT: change roles, touch Business/ServiceProviderApproval status, delete users, or reset the DB.
 * Safe to run multiple times.
 */
require('dotenv').config();
const prisma = require('../src/lib/prisma');

function onboardingTypeForRole(role) {
  switch (role) {
    case 'SERVICE_PROVIDER':
    case 'BUSINESS': // legacy → treated as provider for onboarding (role itself unchanged)
      return 'SERVICE_PROVIDER';
    case 'SERVICE_RECIPIENT':
    case 'CUSTOMER': // legacy → treated as recipient for onboarding (role itself unchanged)
      return 'SERVICE_RECIPIENT';
    case 'ADMIN':
    default:
      return 'NONE';
  }
}

async function main() {
  const users = await prisma.user.findMany();
  let identitiesCreated = 0;
  let identitiesExisting = 0;
  let usersUpdated = 0;

  for (const user of users) {
    // 1. Ensure a PASSWORD auth identity exists (idempotent via @@unique([userId, provider]))
    const existing = await prisma.authIdentity.findUnique({
      where: { userId_provider: { userId: user.id, provider: 'PASSWORD' } }
    });
    if (existing) {
      identitiesExisting += 1;
    } else {
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'PASSWORD',
          providerUserId: null,
          providerEmail: user.email || null,
          providerEmailVerified: user.emailVerified === true,
          passwordHash: user.passwordHash
        }
      });
      identitiesCreated += 1;
    }

    // 2 + 3. Set onboarding metadata (no role change)
    const onboardingType = onboardingTypeForRole(user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStatus: 'COMPLETED', onboardingType }
    });
    usersUpdated += 1;
  }

  console.log('Backfill complete.');
  console.log(`  Users processed:      ${users.length}`);
  console.log(`  Users updated:        ${usersUpdated} (onboardingStatus=COMPLETED, onboardingType by role)`);
  console.log(`  AuthIdentity created: ${identitiesCreated}`);
  console.log(`  AuthIdentity existed: ${identitiesExisting}`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
