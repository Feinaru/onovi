/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_id]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceLeadId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[convertedToBusinessId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_id]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_id]` on the table `Slot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServiceColor" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SuggestionRequestType" AS ENUM ('FIELD', 'PROFESSION', 'SERVICE');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SERVICE_RECIPIENT';
ALTER TYPE "UserRole" ADD VALUE 'SERVICE_PROVIDER';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_businessId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "phoneNormalized" TEXT,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "sourceLeadId" INTEGER,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "convertedToBusinessId" INTEGER,
ADD COLUMN     "phoneNormalized" TEXT,
ADD COLUMN     "registrationCompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" INTEGER,
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "public_id" TEXT,
ADD COLUMN     "serviceTemplateId" INTEGER;

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "public_id" TEXT;

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHebrew" TEXT NOT NULL,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameHebrew" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTemplate" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "professionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameHebrew" TEXT NOT NULL,
    "description" TEXT,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "defaultPrice" INTEGER,
    "colorLevel" "ServiceColor" NOT NULL DEFAULT 'GREEN',
    "colorNote" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHebrew" TEXT NOT NULL,
    "description" TEXT,
    "acceptedFormats" TEXT NOT NULL,
    "maxSizeKB" INTEGER NOT NULL,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDocumentRequirement" (
    "id" SERIAL NOT NULL,
    "serviceTemplateId" INTEGER NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "instruction" TEXT,
    "instructionHebrew" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeKB" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "isPubliclyVisible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfession" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "professionId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessProfession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessServiceDocument" (
    "id" SERIAL NOT NULL,
    "businessServiceId" INTEGER NOT NULL,
    "uploadedDocumentId" INTEGER NOT NULL,
    "serviceDocumentRequirementId" INTEGER NOT NULL,
    "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessServiceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProviderApproval" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "serviceProviderId" INTEGER NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "adminNote" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionRequest" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "requestType" "SuggestionRequestType" NOT NULL,
    "requestedName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "contextInfo" TEXT,
    "requestedById" INTEGER NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "titleHe" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "contentHe" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "requiresScroll" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "consentTypeId" INTEGER NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" INTEGER NOT NULL,
    "wasScrolled" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "selectedServicesSnapshot" TEXT,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER NOT NULL,

    CONSTRAINT "ApplicationSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Field_publicId_key" ON "Field"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Field_name_key" ON "Field"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_publicId_key" ON "Profession"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_fieldId_name_key" ON "Profession"("fieldId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTemplate_publicId_key" ON "ServiceTemplate"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_publicId_key" ON "DocumentType"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDocumentRequirement_serviceTemplateId_documentTypeId_key" ON "ServiceDocumentRequirement"("serviceTemplateId", "documentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedDocument_publicId_key" ON "UploadedDocument"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfession_businessId_professionId_key" ON "BusinessProfession"("businessId", "professionId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessServiceDocument_businessServiceId_serviceDocumentRe_key" ON "BusinessServiceDocument"("businessServiceId", "serviceDocumentRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderApproval_publicId_key" ON "ServiceProviderApproval"("publicId");

-- CreateIndex
CREATE INDEX "ServiceProviderApproval_serviceProviderId_idx" ON "ServiceProviderApproval"("serviceProviderId");

-- CreateIndex
CREATE INDEX "ServiceProviderApproval_status_idx" ON "ServiceProviderApproval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionRequest_publicId_key" ON "SuggestionRequest"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentType_code_key" ON "ConsentType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_publicId_key" ON "UserConsent"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_consentTypeId_consentVersion_key" ON "UserConsent"("userId", "consentTypeId", "consentVersion");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_public_id_key" ON "Booking"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "Business_public_id_key" ON "Business"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "Business_sourceLeadId_key" ON "Business"("sourceLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedToBusinessId_key" ON "Lead"("convertedToBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_public_id_key" ON "Service"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_public_id_key" ON "Slot"("public_id");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_sourceLeadId_fkey" FOREIGN KEY ("sourceLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_serviceTemplateId_fkey" FOREIGN KEY ("serviceTemplateId") REFERENCES "ServiceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profession" ADD CONSTRAINT "Profession_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTemplate" ADD CONSTRAINT "ServiceTemplate_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocumentRequirement" ADD CONSTRAINT "ServiceDocumentRequirement_serviceTemplateId_fkey" FOREIGN KEY ("serviceTemplateId") REFERENCES "ServiceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocumentRequirement" ADD CONSTRAINT "ServiceDocumentRequirement_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfession" ADD CONSTRAINT "BusinessProfession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfession" ADD CONSTRAINT "BusinessProfession_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessServiceDocument" ADD CONSTRAINT "BusinessServiceDocument_businessServiceId_fkey" FOREIGN KEY ("businessServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessServiceDocument" ADD CONSTRAINT "BusinessServiceDocument_uploadedDocumentId_fkey" FOREIGN KEY ("uploadedDocumentId") REFERENCES "UploadedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessServiceDocument" ADD CONSTRAINT "BusinessServiceDocument_serviceDocumentRequirementId_fkey" FOREIGN KEY ("serviceDocumentRequirementId") REFERENCES "ServiceDocumentRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderApproval" ADD CONSTRAINT "ServiceProviderApproval_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderApproval" ADD CONSTRAINT "ServiceProviderApproval_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionRequest" ADD CONSTRAINT "SuggestionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionRequest" ADD CONSTRAINT "SuggestionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_consentTypeId_fkey" FOREIGN KEY ("consentTypeId") REFERENCES "ConsentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSetting" ADD CONSTRAINT "ApplicationSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
