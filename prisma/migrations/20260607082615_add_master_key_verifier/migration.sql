-- AlterTable
ALTER TABLE "User" ADD COLUMN     "masterKeyVerifier" TEXT,
ADD COLUMN     "masterKeyVerifierIv" TEXT;
