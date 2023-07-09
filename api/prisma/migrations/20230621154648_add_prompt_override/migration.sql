/*
  Warnings:

  - You are about to drop the `Generator` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Generator" DROP CONSTRAINT "Generator_parent_id_fkey";

-- DropTable
DROP TABLE "Generator";

-- CreateTable
CREATE TABLE "generators" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formatPrompt" TEXT,
    "imageUri" TEXT,
    "allowsImageGeneration" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" INTEGER,
    "promptOverride" TEXT,

    CONSTRAINT "generators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parentId" ON "generators"("parent_id");

-- AddForeignKey
ALTER TABLE "generators" ADD CONSTRAINT "generators_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "generators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
