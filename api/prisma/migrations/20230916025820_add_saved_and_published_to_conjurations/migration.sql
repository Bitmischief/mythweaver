-- AlterTable
ALTER TABLE "conjurations" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "saved" BOOLEAN NOT NULL DEFAULT false;
