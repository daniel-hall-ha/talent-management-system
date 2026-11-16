# Talent Management System v1

React and TypeScript frontend, Express and TypeScript API, PostgreSQL, and Prisma.
Requires Node.js 22.18 or newer for direct TypeScript execution in development and seeding.

## Included

- Sign in with a seeded super admin and secure, HTTP-only session cookie.
- Monthly SOW calendar with grid and column views, date-only events, overlapping event rows, and event details.
- Create, edit, and delete events with title, description, color, dates, key points, call to action, and restricted CD keys.
- Assign multiple active users with the Talents role to an event through a searchable selector. The seed creates the Talents role with no menu permissions; assign permissions in User Roles if needed.
- Role management with explicit view, add, edit, and delete permissions per menu.
- User management with one role per user; deleting a user disables their account.
- Server-side permission middleware on every protected API route. CD keys are encrypted with AES-256-GCM at rest and returned only through a separate protected endpoint.

## Local setup

1. Copy `.env.example` to `apps/api/.env`. Set `SUPER_ADMIN_EMAIL`, a unique `SUPER_ADMIN_PASSWORD` of at least 12 characters, `SESSION_SECRET` of at least 24 characters, and a 64-character hex `CD_KEY_ENCRYPTION_KEY`. Generate the encryption key with `openssl rand -hex 32`.
2. Start PostgreSQL with `docker compose up -d`, or provide your own PostgreSQL server.
3. Run `npm install`.
4. Run `npm run db:up` to create the blank database named by `DATABASE_URL` if it does not already exist. This command does not migrate or seed it. Then run `npm run db:migrate` and `npm run db:seed`.
5. Run `npm run dev`, then open `http://localhost:5173`.

The API listens on port 3001 by default. For a frontend on another origin, set `WEB_ORIGIN` in `apps/api/.env`.

## Security notes

The super admin password is read only during the initial seed. Changing it in `.env` after the user exists does not rotate the stored hash. Keep the encryption key backed up: losing it makes stored CD keys unreadable. The API excludes CD keys from calendar responses and checks `CD_KEY_VIEW` when revealing them. Role creators can grant only permissions they hold, and users can assign only roles within their own permissions.

## Verification

`npm run build` compiles both workspaces. Database-backed flows require a running PostgreSQL instance and the migration and seed steps above.
