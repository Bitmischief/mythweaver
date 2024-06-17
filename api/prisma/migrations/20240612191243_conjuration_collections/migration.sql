-- CreateTable
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "name" TEXT NOT NULL,
    "parentCollectionId" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_conjurations" (
    "collectionId" INTEGER NOT NULL,
    "conjurationId" INTEGER NOT NULL,

    CONSTRAINT "collection_conjurations_pkey" PRIMARY KEY ("collectionId","conjurationId")
);

-- CreateIndex
CREATE INDEX "collections_id" ON "collections"("id");

-- CreateIndex
CREATE INDEX "collections_parent_collection_id" ON "collections"("parentCollectionId");

-- CreateIndex
CREATE INDEX "collection_conjurations_collection_id_conjuration_id" ON "collection_conjurations"("collectionId", "conjurationId");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_conjurations" ADD CONSTRAINT "collection_conjurations_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_conjurations" ADD CONSTRAINT "collection_conjurations_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
