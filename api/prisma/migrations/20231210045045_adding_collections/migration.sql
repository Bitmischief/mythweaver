/*
  Warnings:

  - You are about to drop the column `campaignId` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `collectionRequestId` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `collections` table. All the data in the column will be lost.
  - You are about to drop the `collection_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `collection_users` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `userId` on table `collections` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "collection_requests" DROP CONSTRAINT "collection_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "collection_users" DROP CONSTRAINT "collection_users_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "collection_users" DROP CONSTRAINT "collection_users_userId_fkey";

-- DropForeignKey
ALTER TABLE "collections" DROP CONSTRAINT "collections_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "collections" DROP CONSTRAINT "collections_collectionRequestId_fkey";

-- DropForeignKey
ALTER TABLE "collections" DROP CONSTRAINT "collections_userId_fkey";

-- AlterTable
CREATE SEQUENCE collections_id_seq;
ALTER TABLE "collections" DROP COLUMN "campaignId",
DROP COLUMN "collectionRequestId",
DROP COLUMN "published",
ALTER COLUMN "id" SET DEFAULT nextval('collections_id_seq'),
ALTER COLUMN "userId" SET NOT NULL;
ALTER SEQUENCE collections_id_seq OWNED BY "collections"."id";

-- DropTable
DROP TABLE "collection_requests";

-- DropTable
DROP TABLE "collection_users";

-- CreateTable
CREATE TABLE "conjuration_collections" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "conjurationId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,

    CONSTRAINT "conjuration_collections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjuration_collections" ADD CONSTRAINT "conjuration_collections_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjuration_collections" ADD CONSTRAINT "conjuration_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
