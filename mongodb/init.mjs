// Creates the MongoDB collections and indexes for Skill Galaxy.
// Replaces the old supabase/schema.sql (no SQL/RLS needed for a single-user app).
//
// Usage:
//   cp .env.example .env.local   # set MONGODB_URI
//   npm run db:init

import { connect } from "./connect.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "skill_galaxy";
let client;

try {
  client = await connect(uri);
  const db = client.db(dbName);

  await db.collection("groups").createIndexes([
    { key: { slug: 1 }, unique: true, name: "uniq_groups_slug" },
    { key: { sortOrder: 1, name: 1 }, name: "groups_sort" },
  ]);

  await db.collection("skills").createIndexes([
    { key: { groupId: 1 }, name: "skills_group_id" },
    { key: { status: 1 }, name: "skills_status" },
    { key: { sortOrder: 1, name: 1 }, name: "skills_sort" },
  ]);

  await db.collection("todos").createIndexes([
    { key: { sortOrder: 1 }, name: "todos_sort" },
    { key: { archived: 1 }, name: "todos_archived" },
  ]);

  await db.collection("tasks").createIndexes([
    { key: { todoId: 1, sortOrder: 1 }, name: "tasks_todo_sort" },
    { key: { done: 1 }, name: "tasks_done" },
  ]);

  console.log(`Indexes ready in database "${dbName}" (groups, skills, todos, tasks).`);
} catch (error) {
  console.error("Failed to initialize MongoDB:", error);
  process.exitCode = 1;
} finally {
  await client?.close();
}
