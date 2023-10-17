-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "stylePreset" TEXT,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "images_user_id" ON "images"("userId");

INSERT INTO "images" ("userId", "uri", "prompt", "negativePrompt", "stylePreset", "conjurationId")
SELECT "userId", "imageUri", '', '', 'fantasy-art', "id"
FROM "conjurations"
WHERE "imageUri" IS NOT NULL
