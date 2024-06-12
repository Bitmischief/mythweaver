-- CreateIndex
CREATE INDEX "conjuration_relationships_previous_type" ON "conjuration_relationships"("previousType");

-- CreateIndex
CREATE INDEX "conjuration_relationships_next_type" ON "conjuration_relationships"("nextType");

-- CreateIndex
CREATE INDEX "conjuration_relationships_previous_type_previous_node_id" ON "conjuration_relationships"("previousType","previousNodeId");

-- CreateIndex
CREATE INDEX "conjuration_relationships_next_type_next_node_id" ON "conjuration_relationships"("nextType","nextNodeId");
