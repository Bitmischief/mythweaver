-- AlterTable
ALTER TABLE "images" ADD COLUMN     "characterId" INTEGER,
ADD COLUMN     "conjurationId" INTEGER,
ADD COLUMN     "sessionId" INTEGER;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "images" ("userId", "uri", "prompt", "negativePrompt", "stylePreset", "conjurationId")
SELECT "userId", "imageUri", '', '', 'fantasy-art', "id"
FROM "conjurations"
WHERE "imageUri" IS NOT NULL AND "userId" IS NOT NULL;