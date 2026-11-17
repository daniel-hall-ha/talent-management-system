ALTER TABLE "User" ADD COLUMN "loginId" TEXT;
UPDATE "User" AS u SET "loginId" =
  COALESCE(NULLIF(LEFT(REGEXP_REPLACE(LOWER(u."name"), '[^a-z0-9]+', '', 'g'), 40), ''), 'user') ||
  SUBSTRING(MD5(u."id" || RANDOM()::TEXT), 1, 6)
FROM "Role" AS r
WHERE u."roleId" = r."id" AND r."createAccount" = true;
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
