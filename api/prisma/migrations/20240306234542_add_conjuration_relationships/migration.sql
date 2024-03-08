/*
  Warnings:

  - You are about to drop the `ConjurationRelationships` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ConjurationRelationshipType" AS ENUM ('CONJURATION', 'SESSION', 'CHARACTER', 'CAMPAIGN');

-- DropForeignKey
ALTER TABLE "ConjurationRelationships" DROP CONSTRAINT "ConjurationRelationships_nextNodeId_fkey";

-- DropForeignKey
ALTER TABLE "ConjurationRelationships" DROP CONSTRAINT "ConjurationRelationships_previousNodeId_fkey";

-- DropTable
DROP TABLE "ConjurationRelationships";

-- CreateTable
CREATE TABLE "conjuration_relatiopnships" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "previousNodeId" INTEGER NOT NULL,
    "nextNodeId" INTEGER NOT NULL,
    "type" "ConjurationRelationshipType" NOT NULL,
    "comment" TEXT,
    "data" JSONB,

    CONSTRAINT "conjuration_relatiopnships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conjuration_relationships_previous_node_id" ON "conjuration_relatiopnships"("previousNodeId");

-- CreateIndex
CREATE INDEX "conjuration_relationships_next_node_id" ON "conjuration_relatiopnships"("nextNodeId");
