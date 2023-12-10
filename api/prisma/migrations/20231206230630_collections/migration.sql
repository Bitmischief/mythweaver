-- AlterTable
CREATE SEQUENCE collections_id_seq;
ALTER TABLE "collections" ALTER COLUMN "id" SET DEFAULT nextval('collections_id_seq');
ALTER SEQUENCE collections_id_seq OWNED BY "collections"."id";
