/*
  Warnings:

  - You are about to drop the column `type` on the `conjuration_relationships` table. All the data in the column will be lost.
  - Added the required column `nextType` to the `conjuration_relationships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousType` to the `conjuration_relationships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conjuration_relationships" DROP COLUMN "type",
ADD COLUMN     "nextType" "ConjurationRelationshipType" NOT NULL,
ADD COLUMN     "previousType" "ConjurationRelationshipType" NOT NULL;
