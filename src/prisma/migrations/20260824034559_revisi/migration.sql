/*
  Warnings:

  - A unique constraint covering the columns `[externalEmployeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Reimbursement` ADD COLUMN `advanceAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `differenceAmount` DECIMAL(15, 2) NULL,
    ADD COLUMN `externalJournalRef` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TravelPolicy` ADD COLUMN `destinationTier` ENUM('DOMESTIC', 'INTERNATIONAL') NOT NULL DEFAULT 'DOMESTIC',
    ADD COLUMN `positionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `externalEmployeeId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('EMPLOYEE', 'MANAGER', 'DEPARTMENT_HEAD', 'HRD', 'FINANCE', 'TRAVEL_ADMIN', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'EMPLOYEE';

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `TravelPolicy_positionId_idx` ON `TravelPolicy`(`positionId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_externalEmployeeId_key` ON `User`(`externalEmployeeId`);

-- AddForeignKey
ALTER TABLE `TravelPolicy` ADD CONSTRAINT `TravelPolicy_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
