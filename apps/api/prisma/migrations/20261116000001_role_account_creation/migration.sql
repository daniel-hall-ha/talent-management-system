ALTER TABLE "Role" ADD COLUMN "createAccount" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Role" SET "createAccount" = true WHERE "system" = true;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
UPDATE "User" SET "passwordHash" = NULL WHERE "roleId" IN (SELECT "id" FROM "Role" WHERE "createAccount" = false);
