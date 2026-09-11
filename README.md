# Asset Manager — IT Asset Management System

A browser-based IT asset management system built with **Next.js** (App Router) and
**Supabase** (Postgres + Auth), meant to be deployed on **Vercel**. It is a normal
responsive website — no app install, works in Chrome/Edge/Safari on desktop and mobile.

It was seeded from the organisation's existing `ORI Master List for Asset 2.xlsx`
(sheet "Aug 26", 283 records as of 2026-08-26), preserving the original data and
flagging anything ambiguous for review rather than guessing.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project. Pick any name/region and a
   database password (save it somewhere safe).
2. Once it's ready, open **Project Settings → API**. You'll need:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret — never put it in `NEXT_PUBLIC_*` or commit it)

## 2. Load the schema and the existing masterlist

**Option A — SQL Editor (simplest, no CLI needed):**

In the Supabase dashboard, open **SQL Editor → New query**:

1. Paste the contents of [supabase/schema.sql](supabase/schema.sql) and run it.
   This creates all tables, the `admin/manager/staff` roles, row-level security
   policies, and the `assign_asset` / `return_asset` transactional functions.
2. Paste the contents of [supabase/seed.sql](supabase/seed.sql) and run it.
   This imports the 283 original records as 222 distinct physical assets (grouped
   by serial number so an asset that moved between employees keeps one history,
   not duplicate rows), 58 employees and 12 departments.

**Option B — Supabase CLI** (this repo is already set up for it —
`supabase/config.toml` and `supabase/migrations/` exist):

```bash
npx supabase login                                      # opens your browser once
npx supabase link --project-ref sjgtifodzqyzbcysyzld     # asks for your DB password
npx supabase db push                                     # applies supabase/migrations/*.sql (the schema)
npx supabase db query --linked -f supabase/seed.sql       # loads the 283 imported records, once
```

Only run the seed command once — it's a plain one-time `INSERT` script wrapped in a
transaction, so running it twice will fail cleanly on the unique-serial constraint
rather than duplicating data, but there's no need to repeat it. Going forward, any
future schema change should be added as a new file in `supabase/migrations/` and
applied with `supabase db push`.

The seed script prints an import summary as SQL comments at the bottom of the file:
counts of records created and how many were flagged `needs_verification` (missing
serials, "Claimed to be used by…" remarks, or a return date that had to be inferred
because the original sheet never recorded one). Review those under **Data
Verification** in the app after first login — nothing was silently guessed or deleted.

## 3. Create your first administrator

Because there's no login yet, you create the very first admin directly in Supabase:

1. **Authentication → Users → Add user** — enter your email + a password, and tick
   "Auto confirm user".
2. Back in **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin', full_name = 'Your Name'
   where email = 'your-email@example.com';
   ```
   (A `profiles` row is created automatically for every new auth user, defaulted to
   `staff` — this just promotes yours to admin.)

From then on, use the in-app **Users** page (admin-only) to create accounts for
everyone else — no more manual SQL needed.

## 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` is only ever read from the **Users** server action
(`lib/actions/users.ts`, to create new logins) — it is never sent to the browser.

## 5. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign in with the admin account from step 3.

## 6. Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this from there).
2. In Vercel: **New Project** → import the repo.
3. Add the same three environment variables from step 4 in the Vercel project settings.
4. Deploy. Vercel will give you a live `https://…vercel.app` URL — share that with
   your team (they still need an account created via **Users** to log in).

## What's implemented

- **Auth & roles**: Supabase Auth (email/password, hashed & session-managed by
  Supabase) with three roles — Admin (full access), Manager (read-only + reports),
  Staff (search/browse, no edit rights). Enforced both in the UI and via Postgres
  Row-Level Security, so it holds even if someone calls the API directly.
- **Assets**: register, edit, assign, return, change status (Available / Assigned /
  Under Maintenance / Lost / Damaged / Retired / Disposed / Pending Verification),
  full history per asset, duplicate-serial detection with an override for genuinely
  different items.
- **Employees**: profile, employment status (Active/Resigned/Inactive/On Leave),
  automatic "outstanding assets" warning when marking someone resigned.
- **Departments**: add/rename/deactivate (soft — historical asset links are kept).
- **Dashboard**: In Use / Available / In Stock / Other summary cards with a
  distribution bar, detailed status breakdown, category & department breakdowns,
  recent activity, and administrative alerts (outstanding assets from resigned
  staff, records needing verification).
- **Reports**: Asset Register, Employee Asset Report, Department Asset Report,
  Unassigned, Returned, Missing/Lost, Maintenance, and Employee Clearance — each
  exportable to CSV or Excel, respecting active filters.
- **Data Verification**: a dedicated queue for anything the import couldn't
  confidently resolve (see below), with a resolve-with-note action.
- **Audit log**: every create/edit/assign/return/status-change/role-change is
  recorded with who, when, and old/new values — admin-only, filterable.
- **Printable forms**: Asset Handover and Asset Return forms (browser print → PDF).
- **Global search & filters** across type, brand, serial, IMEI, phone, department,
  status, employee.

## Import & data-integrity decisions (documented, not silent)

The source spreadsheet stores history by repeating a row per assignment event and
using merged cells for "same person as above." The import script
(`tools/etl.cjs` → `tools/gen-seed-sql.cjs`) reconstructs that into one asset +
many assignment records, and flags for verification rather than assuming:

- A serial number that is blank / "NA" / "-" / "NIL" is **not** treated as a real
  identifier (too many unrelated items share those placeholders) — each such row
  becomes its own asset instead of being merged with others.
- A remark containing "claimed to be used by…" is kept as the recorded remark,
  **not** treated as the actual assignee — flagged `needs_verification` instead,
  per the instruction to treat such remarks as unconfirmed.
- Where the sheet reassigned an asset to a new employee without ever recording the
  previous person's return date, a return date was inferred (the next issue date)
  so the data model stays consistent (only one open assignment per asset at a
  time), and the record is flagged for a human to confirm.
- An employee whose remark history contains "resigned" is marked
  `employment_status = resigned`; if an asset assigned to them was never marked
  returned, it surfaces under **Dashboard alerts** and **Data Verification** —
  it is not auto-returned.
- Two assets shared a duplicate serial only where the type/description also
  matched across rows; the two cases where the type didn't match (a probable
  original data-entry error) were kept as separate rows and flagged rather than
  merged or corrected.

## Deliberately deferred (documented scope decisions)

To ship a working, correct core (Dashboard → Asset → Employee → Assignment →
Return → History → Report) rather than a wide, half-finished surface:

- **In-app Excel/CSV importer UI** — the one-time initial migration is handled by
  `supabase/seed.sql`. `tools/etl.cjs` and `tools/gen-seed-sql.cjs` can be re-run
  against an updated spreadsheet if you ever need to re-import; a guided in-app
  importer (column mapping, per-row error report) is a reasonable Phase 2 addition
  if ad hoc imports become a recurring need.
- **True server-generated PDFs** — printable forms use the browser's native
  print-to-PDF (a print-optimized stylesheet is already applied), rather than a
  PDF-generation library.
- **Distributed rate limiting** — login attempts are governed by Supabase Auth's
  own built-in limits; a dedicated Redis-backed limiter is a Phase 2 item if abuse
  becomes a concern.
- **Per-employee "my assets" staff view** — `profiles.employee_id` and the `staff`
  role already exist for this; staff currently have read access to the full asset
  and employee directory (needed for "search assets" per the spec) rather than a
  restricted personal view.

## Project layout

```
app/(app)/          authenticated pages (dashboard, assets, employees, …)
app/login/           sign-in
app/print/            printable handover/return forms
app/deactivated/      shown to a deactivated user
lib/supabase/         browser/server/admin Supabase clients + middleware session refresh
lib/actions/          Server Actions (all writes go through these)
lib/types.ts          shared TS types + the Database type (RPC signatures, enums)
components/           shared UI (badges, forms, tables, export buttons, nav)
supabase/schema.sql    tables, RLS policies, transactional RPC functions
supabase/seed.sql      generated one-time import of the existing masterlist
tools/                 the ETL scripts that produced seed.sql from the .xlsx file
```
