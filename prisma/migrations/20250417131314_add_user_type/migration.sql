-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'normal_user');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'normal_user';
