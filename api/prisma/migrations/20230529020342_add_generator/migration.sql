-- CreateTable
CREATE TABLE "Generator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parent_id" INTEGER,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parentId" ON "Generator"("parent_id");

-- AddForeignKey
ALTER TABLE "Generator" ADD CONSTRAINT "Generator_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Generator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
