CREATE OR REPLACE FUNCTION sync_legacy_event_deliverables() RETURNS trigger AS $$
BEGIN
  -- New API writes Deliverable rows directly and leaves the legacy JSON empty.
  IF TG_OP = 'INSERT' AND NEW."talentAssignments" = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  DELETE FROM "Deliverable" WHERE "eventId" = NEW.id;
  INSERT INTO "Deliverable" ("id", "eventId", "talentId", "type", "submissionDate", "publishingDate", "status", "links", "sortOrder")
  SELECT
    COALESCE(NULLIF(item.value ->> 'id', ''), md5(NEW.id || assignment.talent_id || item.ordinality::text)),
    NEW.id,
    assignment.talent_id,
    item.value ->> 'deliverable',
    COALESCE(item.value ->> 'submissionDate', ''),
    COALESCE(item.value ->> 'publishingDate', ''),
    COALESCE(item.value ->> 'status', 'Pending'),
    ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(item.value -> 'links') = 'array' THEN item.value -> 'links' ELSE '[]'::jsonb END)),
    item.ordinality::integer - 1
  FROM jsonb_each(CASE WHEN jsonb_typeof(NEW."talentAssignments") = 'object' THEN NEW."talentAssignments" ELSE '{}'::jsonb END) AS assignment(talent_id, rows)
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(assignment.rows) = 'array' THEN assignment.rows ELSE '[]'::jsonb END) WITH ORDINALITY AS item(value, ordinality)
  JOIN "_EventTalents" AS linked ON linked."A" = NEW.id AND linked."B" = assignment.talent_id
  WHERE item.value ->> 'deliverable' IN ('Livestream', 'Highlight', 'Short Video', 'Others');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
