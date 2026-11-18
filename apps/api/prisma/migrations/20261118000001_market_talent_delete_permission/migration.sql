UPDATE "Role"
SET "permissions" = array_append("permissions", 'TALENT_DB_DELETE')
WHERE "system" = true AND NOT ('TALENT_DB_DELETE' = ANY("permissions"));
