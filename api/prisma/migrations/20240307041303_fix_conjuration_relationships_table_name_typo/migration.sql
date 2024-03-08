/*
  Warnings:

  - You are about to drop the `conjuration_relatiopnships` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "conjuration_relatiopnships";

-- CreateTable
CREATE TABLE "conjuration_relationships" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "previousNodeId" INTEGER NOT NULL,
    "nextNodeId" INTEGER NOT NULL,
    "type" "ConjurationRelationshipType" NOT NULL,
    "comment" TEXT,
    "data" JSONB,

    CONSTRAINT "conjuration_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conjuration_relationships_previous_node_id" ON "conjuration_relationships"("previousNodeId");

-- CreateIndex
CREATE INDEX "conjuration_relationships_next_node_id" ON "conjuration_relationships"("nextNodeId");
