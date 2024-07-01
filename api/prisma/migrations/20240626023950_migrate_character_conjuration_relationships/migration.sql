UPDATE "conjuration_relationships"
SET "previousType" = 'CONJURATION'
WHERE "previousType" = 'CHARACTER' AND "nextType" = 'CONJURATION';
