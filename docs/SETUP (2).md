# Setup — Ubuntu WSL, MongoDB, GitHub and Vercel

## 1. Check tools
```bash
node --version
npm --version
git --version
opencode --version
```
Use a Node.js version supported by the current Next.js release and by the
`mongodb` driver (Node >= 20.19). Current Next.js installation docs list
Node.js 20.9 as minimum: https://nextjs.org/docs/app/getting-started/installation

## 2. Scaffold only if directory is empty
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
If this directory is not empty, do not force it or delete files. Scaffold in a temporary sibling directory and merge carefully. Official CLI docs: https://nextjs.org/docs/app/api-reference/cli/create-next-app

## 3. MongoDB setup
1. Create a MongoDB Atlas project (free M0 tier), or use a local MongoDB.
2. Create a database user and copy the connection string
   (`mongodb+srv://USER:PASS@...` or `mongodb://localhost:27017`).
3. Allow your IP in Network Access (or `0.0.0.0/0` for this personal project).
4. Install dependencies and create collections/indexes:
```bash
npm install
cp .env.example .env.local   # set MONGODB_URI
npm run db:init              # runs mongodb/init.mjs
```
Details, collection shapes and troubleshooting: `mongodb/README.md`.

There is no auth in v1: this is a private single-user dashboard, so no
sign-in flow, sessions or row-level security are involved.

## 4. Environment variables
```bash
cp .env.example .env.local
```
Set `MONGODB_URI` (required) and optionally `MONGODB_DB` (defaults to
`skill_galaxy`) in `.env.local`. Never commit `.env.local`. Never put the
connection string in a `NEXT_PUBLIC_*` variable — it is a secret and only
server code under `src/lib` may read it.

## 5. Run locally
```bash
npm run dev
```
Open http://localhost:3000. After changes, run the scripts actually defined in `package.json`, commonly:
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 6. GitHub
Create an empty GitHub repository. Inspect existing git setup first:
```bash
git status --short
git remote -v
```
If this is not already a repository, then:
```bash
git init
git add .
git status
git commit -m "Initial Skill Galaxy dashboard"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Do not create duplicate remotes or overwrite an existing branch.

## 7. Vercel
1. Import the GitHub repository into Vercel.
2. Add `MONGODB_URI` (and optionally `MONGODB_DB`) under Project → Settings →
   Environment Variables for Preview and Production.
3. Deploy.
4. Verify Atlas Network Access allows the deployment (or use `0.0.0.0/0`).
5. Test CRUD against a group route on the deployed URL.

## Troubleshooting
- **`MONGODB_URI is not set`:** verify the exact variable name and restart the dev server after changing env files; check the Vercel variable scope (Production/Preview).
- **`IP not allowed`:** update the Atlas Network Access list.
- **Authentication failed:** check the database user credentials in the connection string.
- **Build fails without credentials:** code/type errors are separate from runtime configuration; the build must not require `MONGODB_URI` at import time. Do not invent credentials.
