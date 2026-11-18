UPDATE "Role"
SET "permissions" = array_append("permissions", 'TALENT_DB_DELETE')
WHERE "name" = 'Admin'
  AND 'TALENT_DB_EDIT' = ANY("permissions")
  AND NOT ('TALENT_DB_DELETE' = ANY("permissions"));
