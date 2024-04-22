UPDATE "sessions"
SET "planningJson" = format('{ "time": 1713553780175, "blocks": [{ "id": "ABCDEFHIJK", "data": { "text": "%s" }, "type": "paragraph" }], "version": "2.29.1" }', planning)::json
WHERE "planning" IS NOT NULL AND "planningJson" IS NULL;
