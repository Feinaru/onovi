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
    "identifierType" TEXT NOT NULL DEFAULT 'COMPANY_NUMBER',
    "identifierValue" TEXT NOT NULL DEFAULT '000000000',
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
INSERT INTO "new_Business" ("address", "categoryId", "city", "cityCode", "cityNameHebrew", "createdAt", "description", "formattedAddress", "houseNumber", "id", "latitude", "longitude", "name", "ownerId", "phone", "status", "street", "streetCode", "streetNameHebrew", "updatedAt") SELECT "address", "categoryId", "city", "cityCode", "cityNameHebrew", "createdAt", "description", "formattedAddress", "houseNumber", "id", "latitude", "longitude", "name", "ownerId", "phone", "status", "street", "streetCode", "streetNameHebrew", "updatedAt" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_identifierType_identifierValue_key" ON "Business"("identifierType", "identifierValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
