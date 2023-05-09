-- CreateTable
CREATE TABLE "random-personas" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "name" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "alignment" TEXT NOT NULL,

    CONSTRAINT "random-personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-random-stat-sheet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "class" TEXT NOT NULL,
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

    CONSTRAINT "dnd-5e-random-stat-sheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-random-spell-slots" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eRandomStatSheetId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "dnd-5e-random-spell-slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-random-proficiencies" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eRandomStatSheetId" INTEGER NOT NULL,
    "proficiency" TEXT NOT NULL,

    CONSTRAINT "dnd-5e-random-proficiencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-random-languages" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eRandomStatSheetId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "dnd-5e-random-languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnd-5e-random-spells" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "dnd5eRandomStatSheetId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "savingThrowAmount" INTEGER,
    "savingThrowAttribute" TEXT,

    CONSTRAINT "dnd-5e-random-spells_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dnd-5e-random-spell-slots" ADD CONSTRAINT "dnd-5e-random-spell-slots_dnd5eRandomStatSheetId_fkey" FOREIGN KEY ("dnd5eRandomStatSheetId") REFERENCES "dnd-5e-random-stat-sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-random-proficiencies" ADD CONSTRAINT "dnd-5e-random-proficiencies_dnd5eRandomStatSheetId_fkey" FOREIGN KEY ("dnd5eRandomStatSheetId") REFERENCES "dnd-5e-random-stat-sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-random-languages" ADD CONSTRAINT "dnd-5e-random-languages_dnd5eRandomStatSheetId_fkey" FOREIGN KEY ("dnd5eRandomStatSheetId") REFERENCES "dnd-5e-random-stat-sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnd-5e-random-spells" ADD CONSTRAINT "dnd-5e-random-spells_dnd5eRandomStatSheetId_fkey" FOREIGN KEY ("dnd5eRandomStatSheetId") REFERENCES "dnd-5e-random-stat-sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
