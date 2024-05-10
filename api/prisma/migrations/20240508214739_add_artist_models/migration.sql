-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "inviteCode" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "artists" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "profilePicUri" TEXT,
    "callToActionUri" TEXT,
    "dataCardUri" TEXT,
    "profileImageUris" TEXT[],

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_models" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "description" TEXT NOT NULL,
    "strengths" TEXT[],
    "promptPrefix" TEXT,
    "sampleImageUris" TEXT[],
    "executionUri" TEXT,

    CONSTRAINT "image_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_model_artists" (
    "imageModelId" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,

    CONSTRAINT "image_model_artists_pkey" PRIMARY KEY ("imageModelId","artistId")
);

-- AddForeignKey
ALTER TABLE "image_model_artists" ADD CONSTRAINT "image_model_artists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_model_artists" ADD CONSTRAINT "image_model_artists_imageModelId_fkey" FOREIGN KEY ("imageModelId") REFERENCES "image_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
