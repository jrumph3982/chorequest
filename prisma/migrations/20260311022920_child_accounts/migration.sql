-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pinHash" TEXT,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;
