# MongoDB setup — Skill Galaxy

MongoDB replaces Supabase PostgreSQL as the datastore. There is no auth:
this is a single-user personal dashboard, so documents are not scoped by
owner and there are no RLS policies.

## 1. Get a connection string

Any MongoDB works:

- **MongoDB Atlas (recommended, free M0):** create a project → Database →
  Connect → Drivers → copy the connection string and replace `<password>`.
- **Local:** `mongodb://localhost:27017`

## 2. Environment

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | — | Connection string, e.g. `mongodb+srv://user:pass@...` |
| `MONGODB_DB` | no | `skill_galaxy` | Database name |

Never commit `.env.local`. The connection string is a secret: only use it in
server code (`src/lib/*`), never in a `NEXT_PUBLIC_*` variable.

## 3. Create collections and indexes

```bash
npm run db:init
```

This runs `mongodb/init.mjs` and creates:

| Collection | Indexes |
| --- | --- |
| `groups` | unique `slug`; `sortOrder + name` |
| `skills` | `groupId`; `status`; `sortOrder + name` |

The collections are created lazily on first write, so running this script is
recommended but not strictly required.

## 4. Seed starter data (optional)

```bash
npm run db:seed
```

`mongodb/seed.mjs` fills the database with a data-science + web-development
learning path: 6 groups, 29 skills with real URLs, descriptions, icons,
statuses and progress values.

It is **idempotent and non-destructive**: it uses `$setOnInsert`, so re-running
it only adds whatever is missing. Anything you have already edited — progress,
status, names, order — is left untouched.

## 5. Collections and documents

### `groups`

```jsonc
{
  "_id": ObjectId("..."),
  "name": "React",
  "slug": "react",              // unique, used by /groups/[slug]
  "description": "optional",    // or null
  "icon": "atom",               // optional icon identifier, or null
  "sortOrder": 0,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### `skills`

```jsonc
{
  "_id": ObjectId("..."),
  "groupId": ObjectId("..."),   // references groups._id
  "name": "React docs",
  "url": "https://react.dev",   // http/https only
  "icon": "book",
  "description": null,
  "status": "learning",         // not_started | learning | practiced | mastered
  "progress": 40,               // integer 0-100, set manually
  "sortOrder": 0,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

Deleting a group also deletes its skills (handled in `src/lib/db.ts`).

## 6. Vercel

Add `MONGODB_URI` (and optionally `MONGODB_DB`) to Project → Settings →
Environment Variables for Production and Preview, then redeploy. In Atlas,
allow the Vercel deployment's outbound IPs or use `0.0.0.0/0` in the network
access list for this personal project.

## Troubleshooting

- **`MONGODB_URI is not set`:** the variable is missing in `.env.local` or in
  Vercel; restart the dev server after editing env files.
- **`IP not allowed`:** add your IP (or `0.0.0.0/0`) to Atlas Network Access.
- **Authentication failed:** check username/password in the connection string
  and that the database user has `readWrite` on the target database.
