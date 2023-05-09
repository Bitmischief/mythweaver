/*
  Warnings:

  - A unique constraint covering the columns `[dnd5eId]` on the table `characters` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "dnd5eId" INTEGER,
ADD COLUMN     "type" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "dnd-5e" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "alignment" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "hitPoints" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,

    CONSTRAINT "dnd-5e_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-spell-slots" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "dnd-5e-spell-slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-proficiencies" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eId" INTEGER NOT NULL,
    "proficiency" TEXT NOT NULL,

    CONSTRAINT "dnd-5e-proficiencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-languages" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "dnd-5e-languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-spells" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "savingThrowAmount" INTEGER,
    "savingThrowAttribute" TEXT,

    CONSTRAINT "dnd-5e-spells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "characters_dnd5eId_key" ON "characters"("dnd5eId");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_dnd5eId_fkey" FOREIGN KEY ("dnd5eId") REFERENCES "dnd-5e"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-spell-slots" ADD CONSTRAINT "dnd-5e-spell-slots_dnd5eId_fkey" FOREIGN KEY ("dnd5eId") REFERENCES "dnd-5e"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-proficiencies" ADD CONSTRAINT "dnd-5e-proficiencies_dnd5eId_fkey" FOREIGN KEY ("dnd5eId") REFERENCES "dnd-5e"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-languages" ADD CONSTRAINT "dnd-5e-languages_dnd5eId_fkey" FOREIGN KEY ("dnd5eId") REFERENCES "dnd-5e"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-spells" ADD CONSTRAINT "dnd-5e-spells_dnd5eId_fkey" FOREIGN KEY ("dnd5eId") REFERENCES "dnd-5e"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
