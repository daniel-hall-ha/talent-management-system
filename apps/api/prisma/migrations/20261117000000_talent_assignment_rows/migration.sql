ALTER TABLE "Event" ADD COLUMN "talentAssignments" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Convert existing category arrays into deliverable/date pairs for talents still assigned.
UPDATE "Event" AS event
SET "talentAssignments" = (
  SELECT COALESCE(jsonb_object_agg(link."B", COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'deliverable', category.value,
      'submissionDate', COALESCE(event."talentSubmissionDates" ->> link."B", '')
    ))
    FROM jsonb_array_elements_text(COALESCE(event."talentDeliverables" -> link."B", '[]'::jsonb)) AS category(value)
  ), '[]'::jsonb)), '{}'::jsonb)
  FROM "_EventTalents" AS link
  WHERE link."A" = event.id
);
