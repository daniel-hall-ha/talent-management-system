ALTER TABLE "Event" RENAME COLUMN "callToAction" TO "details";
UPDATE "Event" SET "details" = '' WHERE "details" IS NULL;
ALTER TABLE "Event" ALTER COLUMN "details" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "details" SET DEFAULT '';
