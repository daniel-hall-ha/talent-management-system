ALTER TABLE "Event" ADD COLUMN "talentDeliverables" JSONB NOT NULL DEFAULT '{}'::jsonb;
UPDATE "Event" AS e SET "talentDeliverables" = COALESCE((
  SELECT jsonb_object_agg(et."B", to_jsonb(e."categories"))
  FROM "_EventTalents" AS et WHERE et."A" = e."id"
), '{}'::jsonb) WHERE cardinality(e."categories") > 0;
