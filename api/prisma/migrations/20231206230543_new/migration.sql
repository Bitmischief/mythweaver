-- AlterTable
ALTER TABLE "collections" ALTER COLUMN "id" SET DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "collections_id_seq";
