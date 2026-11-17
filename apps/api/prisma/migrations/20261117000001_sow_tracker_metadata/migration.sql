-- Give each existing deliverable a stable tracker ID and default tracking fields.
UPDATE "Event" AS event
SET "talentAssignments" = COALESCE((
  SELECT jsonb_object_agg(assignment.talent_id, COALESCE((
    SELECT jsonb_agg(
      item.value || jsonb_build_object(
        'id', COALESCE(item.value ->> 'id', md5(random()::text || clock_timestamp()::text)),
        'status', COALESCE(item.value ->> 'status', 'Pending'),
        'links', COALESCE(item.value -> 'links', '[]'::jsonb)
      ) ORDER BY item.ordinality
    )
    FROM jsonb_array_elements(assignment.rows) WITH ORDINALITY AS item(value, ordinality)
  ), '[]'::jsonb))
  FROM jsonb_each(event."talentAssignments") AS assignment(talent_id, rows)
), '{}'::jsonb)
WHERE event."talentAssignments" <> '{}'::jsonb;
