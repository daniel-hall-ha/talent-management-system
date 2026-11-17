CREATE TABLE "MarketTalent" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "facebookPage" TEXT NOT NULL DEFAULT '',
  "facebookFollowers" INTEGER,
  "tiktokChannel" TEXT NOT NULL DEFAULT '',
  "tiktokFollowers" INTEGER,
  "youtubeChannel" TEXT NOT NULL DEFAULT '',
  "youtubeFollowers" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketTalent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketTalentTag" (
  "name" TEXT NOT NULL,
  CONSTRAINT "MarketTalentTag_pkey" PRIMARY KEY ("name")
);
UPDATE "Role" SET "permissions" = array_cat("permissions", ARRAY['TALENT_DB_VIEW','TALENT_DB_ADD','TALENT_DB_EDIT']::TEXT[]) WHERE "system" = true;
INSERT INTO "MarketTalentTag" ("name") VALUES ('LIFESTYLE'),('TECH'),('GAMING'),('SINGER'),('DANCER'),('ACTOR'),('VLOGGER'),('FOOD_VLOGGER'),('BEAUTY'),('EDUCATION'),('MEDICINE'),('AESTHETIC');
