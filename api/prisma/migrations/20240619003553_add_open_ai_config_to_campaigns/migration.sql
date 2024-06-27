-- DropIndex
DROP INDEX "conjuration_relationships_next_type";

-- DropIndex
DROP INDEX "conjuration_relationships_next_type_next_node_id";

-- DropIndex
DROP INDEX "conjuration_relationships_previous_type";

-- DropIndex
DROP INDEX "conjuration_relationships_previous_type_previous_node_id";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "openAiConfig" JSONB;
