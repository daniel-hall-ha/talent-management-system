-- Preserve administrator-wide access while making ordinary View grants self-scoped.
UPDATE "Role" SET permissions = array_append(permissions, 'SOW_VIEW_ALL')
WHERE system = true AND NOT ('SOW_VIEW_ALL' = ANY(permissions));
UPDATE "Role" SET permissions = array_append(permissions, 'TRACKER_VIEW_ALL')
WHERE system = true AND NOT ('TRACKER_VIEW_ALL' = ANY(permissions));
UPDATE "Role" SET permissions = array_append(permissions, 'TRACKER_EDIT')
WHERE system = true AND NOT ('TRACKER_EDIT' = ANY(permissions));
UPDATE "Role" SET permissions = array_append(permissions, 'CD_KEY_VIEW_ALL')
WHERE system = true AND NOT ('CD_KEY_VIEW_ALL' = ANY(permissions));
UPDATE "Role" SET permissions = array_append(permissions, 'TRACKER_VIEW')
WHERE system = false AND 'SOW_VIEW' = ANY(permissions) AND NOT ('TRACKER_VIEW' = ANY(permissions));
