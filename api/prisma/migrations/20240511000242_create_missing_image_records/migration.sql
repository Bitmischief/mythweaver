-- ADD IMAGE RECORDS FOR CONJURATIONS WITHOUT ONE
with imagelessConjurations as (
        SELECT c.id, c."userId", c."imageUri"
        FROM "conjurations" c LEFT JOIN "images" i ON c."id" = i."conjurationId"
        WHERE i."conjurationId" IS NULL AND c."imageUri" IS NOT NULL AND c."imageUri" != ''
    )
INSERT INTO "images" ("userId", "uri", "prompt", "negativePrompt", "stylePreset", "characterId", "conjurationId", "sessionId", seed)
(SELECT
    "userId",
    "imageUri" as uri,
    '' as prompt,
    '' as negativePrompt,
    '' as stylePreset,
    null as characterId,
    "id" as conjurationId,
    null as sessionId,
    null as seed
 FROM imagelessConjurations);

UPDATE "images"
SET "primary" = true
FROM "conjurations" c
WHERE "conjurationId" = c.id AND "uri" = c."imageUri";


-- ADD IMAGE RECORDS FOR CHARACTERS WITHOUT ONE
with imagelessCharacters as (
        SELECT c.id, c."userId", c."imageUri"
        FROM "characters" c LEFT JOIN "images" i ON c."id" = i."characterId"
        WHERE i."characterId" IS NULL AND c."imageUri" IS NOT NULL AND c."imageUri" != ''
    )
INSERT INTO "images" ("userId", "uri", "prompt", "negativePrompt", "stylePreset", "characterId", "conjurationId", "sessionId", seed)
(SELECT
    "userId",
    "imageUri" as uri,
    '' as prompt,
    '' as negativePrompt,
    '' as stylePreset,
    "id" as characterId,
    null as conjurationId,
    null as sessionId,
    null as seed
 FROM imagelessCharacters);

UPDATE "images"
SET "primary" = true
FROM "characters" c
WHERE "characterId" = c.id AND "uri" = c."imageUri";


-- ADD IMAGE RECORDS FOR SESSIONS WITHOUT ONE
with imagelessSessions as (
        SELECT s.id, s."userId", s."imageUri"
        FROM "sessions" s LEFT JOIN "images" i ON s.id = i."sessionId"
        WHERE i."sessionId" IS NULL AND "imageUri" IS NOT NULL AND "imageUri" != ''
    )
INSERT INTO "images" ("userId", "uri", "prompt", "negativePrompt", "stylePreset", "characterId", "conjurationId", "sessionId", seed)
(SELECT
    "userId",
    "imageUri" as uri,
    '' as prompt,
    '' as negativePrompt,
    '' as stylePreset,
    null as characterId,
    null as conjurationId,
    "id" as sessionId,
    null as seed
 FROM imagelessSessions);

UPDATE "images"
SET "primary" = true
FROM "sessions" s
WHERE "sessionId" = s.id AND "uri" = s."imageUri";
