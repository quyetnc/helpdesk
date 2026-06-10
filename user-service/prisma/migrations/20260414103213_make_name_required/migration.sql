/*
  Warnings:

  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- First, set default value for any existing NULL names
UPDATE "users" SET "name" = SPLIT_PART("email", '@', 1) WHERE "name" IS NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
