/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `random-personas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "random-personas_name_key" ON "random-personas"("name");
