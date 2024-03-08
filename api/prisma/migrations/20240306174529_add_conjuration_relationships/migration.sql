-- CreateTable
CREATE TABLE "ConjurationRelationships" (
    "previousNodeId" INTEGER NOT NULL,
    "nextNodeId" INTEGER NOT NULL,

    CONSTRAINT "ConjurationRelationships_pkey" PRIMARY KEY ("previousNodeId","nextNodeId")
);

-- AddForeignKey
ALTER TABLE "ConjurationRelationships" ADD CONSTRAINT "ConjurationRelationships_previousNodeId_fkey" FOREIGN KEY ("previousNodeId") REFERENCES "conjurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConjurationRelationships" ADD CONSTRAINT "ConjurationRelationships_nextNodeId_fkey" FOREIGN KEY ("nextNodeId") REFERENCES "conjurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
