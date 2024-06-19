INSERT INTO "collections" ("name", "userId")
(
    SELECT "name", "userId"
    FROM "campaigns"
);
