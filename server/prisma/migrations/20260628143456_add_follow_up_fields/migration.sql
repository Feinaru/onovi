/*
  Warnings:

  - You are about to drop the column `nextFollowUpDate` on the `Lead` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "cityCode" INTEGER,
    "cityNameHebrew" TEXT,
    "streetCode" INTEGER,
    "streetNameHebrew" TEXT,
    "houseNumber" TEXT,
    "formattedAddress" TEXT,
    "city" TEXT,
    "street" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Business" ("address", "categoryId", "city", "cityCode", "cityNameHebrew", "createdAt", "description", "formattedAddress", "houseNumber", "id", "identifierType", "identifierValue", "latitude", "longitude", "name", "ownerId", "phone", "status", "street", "streetCode", "streetNameHebrew", "updatedAt") SELECT "address", "categoryId", "city", "cityCode", "cityNameHebrew", "createdAt", "description", "formattedAddress", "houseNumber", "id", "identifierType", "identifierValue", "latitude", "longitude", "name", "ownerId", "phone", "status", "street", "streetCode", "streetNameHebrew", "updatedAt" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_identifierType_identifierValue_key" ON "Business"("identifierType", "identifierValue");
CREATE TABLE "new_Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "identifierType" TEXT NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactPersonName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "cityCode" INTEGER,
    "cityNameHebrew" TEXT,
    "streetCode" INTEGER,
    "streetNameHebrew" TEXT,
    "houseNumber" TEXT,
    "formattedAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "categoryId" INTEGER,
    "source" TEXT,
    "linkedBusinessId" INTEGER,
    "nextAction" TEXT,
    "nextActionAt" DATETIME,
    "lastContactedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_linkedBusinessId_fkey" FOREIGN KEY ("linkedBusinessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("businessName", "categoryId", "cityCode", "cityNameHebrew", "contactPersonName", "createdAt", "email", "formattedAddress", "houseNumber", "id", "identifierType", "identifierValue", "lastContactedAt", "linkedBusinessId", "phone", "source", "status", "streetCode", "streetNameHebrew", "updatedAt") SELECT "businessName", "categoryId", "cityCode", "cityNameHebrew", "contactPersonName", "createdAt", "email", "formattedAddress", "houseNumber", "id", "identifierType", "identifierValue", "lastContactedAt", "linkedBusinessId", "phone", "source", "status", "streetCode", "streetNameHebrew", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_nextActionAt_idx" ON "Lead"("nextActionAt");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE UNIQUE INDEX "Lead_identifierType_identifierValue_key" ON "Lead"("identifierType", "identifierValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
