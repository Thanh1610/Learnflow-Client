-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientRefreshToken" TEXT,
ADD COLUMN     "clientRefreshTokenExpiresAt" TIMESTAMP(3);
