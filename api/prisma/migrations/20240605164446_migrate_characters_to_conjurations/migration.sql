-- insert into conjurations from characters, set characterId as backupData, set associated campaignId on conjuration
INSERT INTO "conjurations" ("userId", "campaignId", "name", "data", "tags", "conjurerCode", "imageUri", "visibility", "dataBackup")
    (SELECT "userId",
            "campaignId",
            "name",
            json_build_object(
                    'time', 1715128308723,
                    'blocks', json_build_array(
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "looks",
                                            'label', 'Looks',
                                            'prompt', 'Generate looks for this Character'
                                            ),
                                    'type', 'generationBlock'
                            ),
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "personality",
                                            'label', 'Personality',
                                            'prompt', 'Generate a personality for this Character'
                                            ),
                                    'type', 'generationBlock'
                            ),
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "backstory",
                                            'label', 'Backstory',
                                            'prompt', 'Generate a backstory for this Character'
                                            ),
                                    'type', 'generationBlock'
                            ),
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "age",
                                            'label', 'Age',
                                            'prompt', 'Generate an age for this Character'
                                            ),
                                    'type', 'generationBlock'
                            ),
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "race",
                                            'label', 'Race',
                                            'prompt', 'Generate a race for this Character'
                                            ),
                                    'type', 'generationBlock'
                            ),
                            json_build_object(
                                    'id', nanoid(10),
                                    'data', json_build_object(
                                            'text', "class",
                                            'label', 'Class',
                                            'prompt', 'Generate a class for this Character'
                                            ),
                                    'type', 'generationBlock'
                            )
                        ),
                    'version', '2.29.1'
            ) as "data",
         '{"players"}' as "tags",
         'players' as "conjurerCode",
         "imageUri",
         'PRIVATE' as "visibility",
         row_to_json(c) as "dataBackup"
     FROM characters c);

-- insert into conjuration_users
INSERT INTO "conjuration_users" ("userId", "conjurationId")
(
    SELECT "userId", id as "conjurationId"
    FROM "conjurations"
    WHERE "conjurerCode" = 'players'
) ON CONFLICT DO NOTHING;

-- insert into conjuration_relationships (using id and campaignId) from conjurations where conjurer_code = 'players'
INSERT INTO "conjuration_relationships" ("previousNodeId", "previousType", "nextNodeId", "nextType", "userId")
(
 SELECT
    "campaignId" as "previousNodeId",
    'CAMPAIGN' as "previousType",
    id as "nextNodeId",
    'CHARACTER' as "nextType",
    "userId"
 FROM "conjurations"
 WHERE "conjurerCode" = 'players' AND "campaignId" IS NOT NULL AND "dataBackup" IS NOT NULL
);

-- same as before but create the relationship in the opposite direction
INSERT INTO "conjuration_relationships" ("previousNodeId", "previousType", "nextNodeId", "nextType", "userId")
(
 SELECT
    "campaignId" as "nextNodeId",
    'CAMPAIGN' as "nextType",
    id as "previousNodeId",
    'CHARACTER' as "previousType",
    "userId"
 FROM "conjurations"
 WHERE "conjurerCode" = 'players' AND "campaignId" IS NOT NULL AND "dataBackup" IS NOT NULL
);

-- update images where "characterId" = id we stored in backupData, set "conjurationId" to conjurations id
UPDATE "images"
SET "conjurationId" = con.id
FROM (
    SELECT *
    FROM "conjurations"
    WHERE "conjurerCode" = 'players' AND "dataBackup" IS NOT NULL
) con
WHERE "characterId" = (con."dataBackup"::jsonb ->> 'id')::integer;
