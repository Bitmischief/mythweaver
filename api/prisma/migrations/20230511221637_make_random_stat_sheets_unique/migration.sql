/*
  Warnings:

  - A unique constraint covering the columns `[class,level,strength,dexterity,constitution,intelligence,wisdom,charisma,hitPoints,armorClass,speed]` on the table `dnd-5e-random-stat-sheet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dnd-5e-random-stat-sheet_class_level_strength_dexterity_con_key" ON "dnd-5e-random-stat-sheet"("class", "level", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma", "hitPoints", "armorClass", "speed");
