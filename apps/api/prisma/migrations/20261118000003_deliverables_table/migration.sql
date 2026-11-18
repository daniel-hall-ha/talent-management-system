CREATE TABLE "Deliverable" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "talentId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "submissionDate" TEXT NOT NULL DEFAULT '',
  "publishingDate" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "links" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Deliverable_eventId_talentId_sortOrder_idx" ON "Deliverable"("eventId", "talentId", "sortOrder");
CREATE INDEX "Deliverable_talentId_idx" ON "Deliverable"("talentId");
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Deliverable" ("id", "eventId", "talentId", "type", "submissionDate", "publishingDate", "status", "links", "sortOrder")
SELECT
  COALESCE(NULLIF(item.value ->> 'id', ''), md5(event.id || assignment.talent_id || item.ordinality::text)),
  event.id,
  assignment.talent_id,
  item.value ->> 'deliverable',
  COALESCE(item.value ->> 'submissionDate', ''),
  COALESCE(item.value ->> 'publishingDate', ''),
  COALESCE(item.value ->> 'status', 'Pending'),
  ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(item.value -> 'links') = 'array' THEN item.value -> 'links' ELSE '[]'::jsonb END)),
  item.ordinality::integer - 1
FROM "Event" AS event
CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(event."talentAssignments") = 'object' THEN event."talentAssignments" ELSE '{}'::jsonb END) AS assignment(talent_id, rows)
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(assignment.rows) = 'array' THEN assignment.rows ELSE '[]'::jsonb END) WITH ORDINALITY AS item(value, ordinality)
JOIN "_EventTalents" AS linked ON linked."A" = event.id AND linked."B" = assignment.talent_id
WHERE item.value ->> 'deliverable' IN ('Livestream', 'Highlight', 'Short Video', 'Others')
ON CONFLICT ("id") DO NOTHING;
