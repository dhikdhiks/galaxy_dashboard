import { cacheLife, cacheTag } from "next/cache";
import { Collection, Filter, ObjectId, WithId } from "mongodb";

import { getDb } from "./mongodb";
import {
  Group,
  GroupInput,
  SKILL_STATUSES,
  Skill,
  SkillInput,
  SkillStatus,
  Task,
  TaskInput,
  TaskWithLinks,
  Todo,
  TodoInput,
  TodoWithTasks,
  ValidationError,
} from "./types";

/**
 * Typed data access for groups and skills. All reads and writes go through
 * this module so the UI never talks to the MongoDB driver directly.
 *
 * There is no auth layer: the app is a single-user personal dashboard, so
 * documents are not scoped by owner.
 */

interface GroupDoc {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SkillDoc {
  groupId: ObjectId;
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
  status: SkillStatus;
  progress: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TodoDoc {
  title: string;
  time: Date | null;
  sortOrder: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskDoc {
  todoId: ObjectId;
  label: string;
  done: boolean;
  sortOrder: number;
  skillId: ObjectId | null;
  groupId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

async function groups(): Promise<Collection<GroupDoc>> {
  return (await getDb()).collection<GroupDoc>("groups");
}

async function skills(): Promise<Collection<SkillDoc>> {
  return (await getDb()).collection<SkillDoc>("skills");
}

async function todos(): Promise<Collection<TodoDoc>> {
  return (await getDb()).collection<TodoDoc>("todos");
}

async function tasks(): Promise<Collection<TaskDoc>> {
  return (await getDb()).collection<TaskDoc>("tasks");
}

function toGroup(doc: WithId<GroupDoc>): Group {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}

function toSkill(doc: WithId<SkillDoc>): Skill {
  const { _id, groupId, ...rest } = doc;
  return { id: _id.toHexString(), groupId: groupId.toHexString(), ...rest };
}

function toTodo(doc: WithId<TodoDoc>): Todo {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}

function toTask(doc: WithId<TaskDoc>): Task {
  const { _id, todoId, skillId, groupId, ...rest } = doc;
  return {
    id: _id.toHexString(),
    todoId: todoId.toHexString(),
    skillId: skillId?.toHexString() ?? null,
    groupId: groupId?.toHexString() ?? null,
    ...rest,
  };
}

function toObjectId(value: string, label: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return new ObjectId(value);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requireName(value: string | undefined | null, label = "Name"): string {
  const name = (value ?? "").trim();
  if (!name) throw new ValidationError(`${label} is required`);
  return name;
}

function normalizeText(value: string | undefined | null): string | null {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : null;
}

/** Only HTTP(S) URLs are allowed, matching the PRD security requirement. */
export function assertHttpUrl(value: string): string {
  const raw = (value ?? "").trim();
  if (!raw) throw new ValidationError("URL is required");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError("URL is not valid");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError("URL must use http or https");
  }
  return parsed.toString();
}

function normalizeProgress(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const progress = Math.round(Number(value));
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new ValidationError("Progress must be between 0 and 100");
  }
  return progress;
}

function normalizeStatus(value: SkillStatus | undefined): SkillStatus {
  if (value === undefined) return "not_started";
  if (!SKILL_STATUSES.includes(value)) {
    throw new ValidationError(`Unknown status: ${value}`);
  }
  return value;
}

function normalizeSortOrder(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const order = Math.round(Number(value));
  return Number.isFinite(order) ? order : 0;
}

async function assertUniqueSlug(
  slug: string,
  excludeId?: ObjectId,
): Promise<void> {
  const existing = await (await groups()).findOne({ slug });
  if (!existing) return;
  if (excludeId && existing._id.equals(excludeId)) return;
  throw new ValidationError(`Slug "${slug}" is already used`);
}

/* ---------------------------------- Groups --------------------------------- */

export async function listGroups(): Promise<Group[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("groups");
  const docs = await (await groups())
    .find({})
    .sort({ sortOrder: 1, name: 1 })
    .toArray();
  return docs.map(toGroup);
}

export async function getGroupById(id: string): Promise<Group | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("groups");
  const doc = await (await groups()).findOne({ _id: toObjectId(id, "group id") });
  return doc ? toGroup(doc) : null;
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("groups");
  const doc = await (await groups()).findOne({ slug });
  return doc ? toGroup(doc) : null;
}

/**
 * Existence probe for `src/proxy.ts` with a short-lived
 * in-memory cache: the proxy runs on every `/groups/*`
 * request, and a repeat visit within the TTL skips the
 * round trip. The TTL is short so a group created
 * seconds ago still resolves almost immediately.
 */
const EXISTS_TTL_MS = 5000;
const existsCache = new Map<string, { at: number; exists: boolean }>();

export async function groupExists(slug: string): Promise<boolean> {
  const cached = existsCache.get(slug);
  if (cached && Date.now() - cached.at < EXISTS_TTL_MS) return cached.exists;
  const doc = await (await groups()).findOne(
    { slug },
    { projection: { _id: 1 } },
  );
  const exists = doc !== null;
  existsCache.set(slug, { at: Date.now(), exists });
  return exists;
}

export interface GroupStats {
  group: Group;
  skillCount: number;
  /** Average skill progress in this group, 0 when it has no skills. */
  progress: number;
}

/**
 * Groups enriched with skill count and average progress in one round trip,
 * used by the overview grid.
 */
export async function listGroupsWithStats(): Promise<GroupStats[]> {
  "use cache";
  cacheLife("minutes");
  // Stats blend group and skill data, so both tags apply.
  cacheTag("groups", "skills");
  const rows = await (await groups())
    .aggregate<
      Omit<WithId<GroupDoc>, "_id"> & {
        _id: ObjectId;
        skillCount: number;
        progress: number;
      }
    >([
      { $sort: { sortOrder: 1, name: 1 } },
      {
        $lookup: {
          from: "skills",
          localField: "_id",
          foreignField: "groupId",
          as: "skills",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          icon: 1,
          sortOrder: 1,
          createdAt: 1,
          updatedAt: 1,
          skillCount: { $size: "$skills" },
          progress: { $avg: "$skills.progress" },
        },
      },
    ])
    .toArray();

  return rows.map((row) => ({
    group: toGroup(row),
    skillCount: row.skillCount,
    progress: Math.round(row.progress ?? 0),
  }));
}

export async function createGroup(input: GroupInput): Promise<Group> {
  const name = requireName(input.name, "Group name");
  const slug = slugify(input.slug || name);
  if (!slug) throw new ValidationError("Slug is required");
  await assertUniqueSlug(slug);

  const now = new Date();
  const doc: Omit<GroupDoc, "_id"> = {
    name,
    slug,
    description: normalizeText(input.description),
    icon: normalizeText(input.icon),
    sortOrder: normalizeSortOrder(input.sortOrder),
    createdAt: now,
    updatedAt: now,
  };
  const result = await (await groups()).insertOne(doc);
  return { id: result.insertedId.toHexString(), ...doc };
}

export async function updateGroup(
  id: string,
  patch: Partial<GroupInput>,
): Promise<Group> {
  const _id = toObjectId(id, "group id");
  const collection = await groups();
  const current = await collection.findOne({ _id });
  if (!current) throw new ValidationError("Group not found");

  const updates: Partial<GroupDoc> = { updatedAt: new Date() };
  if (patch.name !== undefined) updates.name = requireName(patch.name, "Group name");
  if (patch.slug !== undefined) {
    const slug = slugify(patch.slug);
    if (!slug) throw new ValidationError("Slug is required");
    await assertUniqueSlug(slug, _id);
    updates.slug = slug;
  }
  if (patch.description !== undefined) updates.description = normalizeText(patch.description);
  if (patch.icon !== undefined) updates.icon = normalizeText(patch.icon);
  if (patch.sortOrder !== undefined) updates.sortOrder = normalizeSortOrder(patch.sortOrder);

  const updated = await collection.findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!updated) throw new ValidationError("Group not found");
  return toGroup(updated);
}

/** Deletes the group and every skill that belongs to it. */
export async function deleteGroup(id: string): Promise<void> {
  const _id = toObjectId(id, "group id");
  const removed = await (await groups()).deleteOne({ _id });
  if (removed.deletedCount === 0) throw new ValidationError("Group not found");
  await (await skills()).deleteMany({ groupId: _id });
}

/* ---------------------------------- Skills --------------------------------- */

export async function listSkills(groupId?: string): Promise<Skill[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("skills");
  const filter: Filter<SkillDoc> = groupId
    ? { groupId: toObjectId(groupId, "group id") }
    : {};
  const docs = await (await skills())
    .find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .toArray();
  return docs.map(toSkill);
}

export async function getSkillById(id: string): Promise<Skill | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("skills");
  const doc = await (await skills()).findOne({ _id: toObjectId(id, "skill id") });
  return doc ? toSkill(doc) : null;
}

export async function createSkill(input: SkillInput): Promise<Skill> {
  const name = requireName(input.name, "Skill name");
  const url = assertHttpUrl(input.url);
  const groupId = toObjectId(input.groupId, "group id");

  const group = await (await groups()).findOne({ _id: groupId });
  if (!group) throw new ValidationError("Group not found");

  const doc: Omit<SkillDoc, "_id"> = {
    groupId,
    name,
    url,
    icon: normalizeText(input.icon),
    description: normalizeText(input.description),
    status: normalizeStatus(input.status),
    progress: normalizeProgress(input.progress),
    sortOrder: normalizeSortOrder(input.sortOrder),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await (await skills()).insertOne(doc);
  return {
    ...doc,
    id: result.insertedId.toHexString(),
    groupId: groupId.toHexString(),
  };
}

export async function updateSkill(
  id: string,
  patch: Partial<SkillInput>,
): Promise<Skill> {
  const _id = toObjectId(id, "skill id");
  const collection = await skills();
  const current = await collection.findOne({ _id });
  if (!current) throw new ValidationError("Skill not found");

  const updates: Partial<SkillDoc> = { updatedAt: new Date() };
  if (patch.name !== undefined) updates.name = requireName(patch.name, "Skill name");
  if (patch.url !== undefined) updates.url = assertHttpUrl(patch.url);
  if (patch.groupId !== undefined) {
    const groupId = toObjectId(patch.groupId, "group id");
    const group = await (await groups()).findOne({ _id: groupId });
    if (!group) throw new ValidationError("Group not found");
    updates.groupId = groupId;
  }
  if (patch.icon !== undefined) updates.icon = normalizeText(patch.icon);
  if (patch.description !== undefined) updates.description = normalizeText(patch.description);
  if (patch.status !== undefined) updates.status = normalizeStatus(patch.status);
  if (patch.progress !== undefined) updates.progress = normalizeProgress(patch.progress);
  if (patch.sortOrder !== undefined) updates.sortOrder = normalizeSortOrder(patch.sortOrder);


  const updated = await collection.findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!updated) throw new ValidationError("Skill not found");
  return toSkill(updated);
}

export async function deleteSkill(id: string): Promise<void> {
  const result = await (await skills()).deleteOne({ _id: toObjectId(id, "skill id") });
  if (result.deletedCount === 0) throw new ValidationError("Skill not found");
}

/* --------------------------------- Progress -------------------------------- */

/**
 * Group progress = average of its skills' manual progress values, rounded.
 * Groups without skills report 0. Documented in IMPLEMENTATION_PLAN Phase 4.
 */
export function averageProgress(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/* --------------------------------- Summary --------------------------------- */

export interface DashboardSummary {
  groups: number;
  skills: number;
  inProgress: number;
  mastered: number;
}

/** Counts for the overview header. */
export async function getSummary(): Promise<DashboardSummary> {
  "use cache";
  cacheLife("minutes");
  cacheTag("groups", "skills");
  const groupCollection = await groups();
  const skillCollection = await skills();
  const [groupCount, skillCount, inProgress, mastered] = await Promise.all([
    groupCollection.countDocuments(),
    skillCollection.countDocuments(),
    skillCollection.countDocuments({ status: { $in: ["learning", "practiced"] } }),
    skillCollection.countDocuments({ status: "mastered" }),
  ]);
  return {
    groups: groupCount,
    skills: skillCount,
    inProgress,
    mastered,
  };
}

/* --------------------------------- Reorder -------------------------------- */

/**
 * Persists a manual order: `orderedIds[0]` becomes sortOrder 0,
 * and so on. Every id must belong to the collection, else the
 * whole write is rejected (partial reorders would corrupt the
 * order for everyone else).
 */
export async function reorderGroups(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const now = new Date();
  const result = await (await groups()).bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: toObjectId(id, "group id") },
        update: { $set: { sortOrder: index, updatedAt: now } },
      },
    })),
  );
  if (result.matchedCount !== orderedIds.length) {
    throw new ValidationError("Some groups no longer exist");
  }
}

export async function reorderSkills(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const now = new Date();
  const result = await (await skills()).bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: toObjectId(id, "skill id") },
        update: { $set: { sortOrder: index, updatedAt: now } },
      },
    })),
  );
  if (result.matchedCount !== orderedIds.length) {
    throw new ValidationError("Some skills no longer exist");
  }
}

/* --------------------------------- To-dos --------------------------------- */

/**
 * Todos with their tasks, each task enriched with the names of
 * its optional skill/group links. One round trip per collection —
 * all four queries run in parallel and are joined in memory.
 */
export async function listTodosWithTasks(): Promise<TodoWithTasks[]> {
  "use cache";
  cacheLife("minutes");
  // Task rows carry skill/group names, so all three tags apply.
  cacheTag("todos", "groups", "skills");

  const [todoDocs, taskDocs, groupDocs, skillDocs] = await Promise.all([
    (await todos()).find({}).sort({ sortOrder: 1, title: 1 }).toArray(),
    (await tasks()).find({}).sort({ sortOrder: 1, label: 1 }).toArray(),
    (await groups())
      .find({}, { projection: { name: 1, slug: 1 } })
      .toArray(),
    (await skills()).find({}, { projection: { name: 1 } }).toArray(),
  ]);

  const groupLinks = new Map(
    groupDocs.map((doc) => [
      doc._id.toHexString(),
      { name: doc.name, slug: doc.slug },
    ]),
  );
  const skillNames = new Map(
    skillDocs.map((doc) => [doc._id.toHexString(), doc.name]),
  );

  const tasksByTodo = new Map<string, TaskWithLinks[]>();
  for (const doc of taskDocs) {
    const todoId = doc.todoId.toHexString();
    const skillId = doc.skillId?.toHexString() ?? null;
    const groupId = doc.groupId?.toHexString() ?? null;
    const group = groupId ? groupLinks.get(groupId) : undefined;
    const task: TaskWithLinks = {
      id: doc._id.toHexString(),
      todoId,
      label: doc.label,
      done: doc.done,
      sortOrder: doc.sortOrder,
      skillId,
      groupId,
      skillName: skillId ? (skillNames.get(skillId) ?? null) : null,
      groupSlug: group?.slug ?? null,
      groupName: group?.name ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    const list = tasksByTodo.get(todoId);
    if (list) list.push(task);
    else tasksByTodo.set(todoId, [task]);
  }

  return todoDocs.map((doc) => {
    const id = doc._id.toHexString();
    const taskList = tasksByTodo.get(id) ?? [];
    return {
      id,
      title: doc.title,
      time: doc.time,
      sortOrder: doc.sortOrder,
      archived: doc.archived,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      tasks: taskList,
      doneCount: taskList.filter((task) => task.done).length,
    };
  });
}

export async function createTodo(input: TodoInput): Promise<Todo> {
  const title = requireName(input.title, "Todo title");
  // New todos append after the existing ones.
  const count = await (await todos()).countDocuments();
  const now = new Date();
  const doc: Omit<TodoDoc, "_id"> = {
    title,
    time: input.time ?? null,
    sortOrder: normalizeSortOrder(input.sortOrder ?? count),
    archived: input.archived ?? false,
    createdAt: now,
    updatedAt: now,
  };
  const result = await (await todos()).insertOne(doc);
  return { id: result.insertedId.toHexString(), ...doc };
}

export async function updateTodo(
  id: string,
  patch: Partial<TodoInput>,
): Promise<Todo> {
  const _id = toObjectId(id, "todo id");
  const collection = await todos();
  const current = await collection.findOne({ _id });
  if (!current) throw new ValidationError("Todo not found");

  const updates: Partial<TodoDoc> = { updatedAt: new Date() };
  if (patch.title !== undefined) {
    updates.title = requireName(patch.title, "Todo title");
  }
  if (patch.time !== undefined) updates.time = patch.time ?? null;
  if (patch.archived !== undefined) updates.archived = patch.archived;
  if (patch.sortOrder !== undefined) {
    updates.sortOrder = normalizeSortOrder(patch.sortOrder);
  }

  const updated = await collection.findOneAndUpdate(
    { _id },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!updated) throw new ValidationError("Todo not found");
  return toTodo(updated);
}

/** Deletes the todo and every task that belongs to it. */
export async function deleteTodo(id: string): Promise<void> {
  const _id = toObjectId(id, "todo id");
  const removed = await (await todos()).deleteOne({ _id });
  if (removed.deletedCount === 0) throw new ValidationError("Todo not found");
  await (await tasks()).deleteMany({ todoId: _id });
}

export async function reorderTodos(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const now = new Date();
  const result = await (await todos()).bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: toObjectId(id, "todo id") },
        update: { $set: { sortOrder: index, updatedAt: now } },
      },
    })),
  );
  if (result.matchedCount !== orderedIds.length) {
    throw new ValidationError("Some todos no longer exist");
  }
}

/**
 * Resolves an optional skill/group link: empty stays null, an
 * unknown id is rejected so a typo never silently drops the link.
 */
async function resolveOptionalLink(
  value: string | null | undefined,
  label: "skill" | "group",
): Promise<ObjectId | null> {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const id = toObjectId(raw, `${label} id`);
  const collection = label === "skill" ? await skills() : await groups();
  const doc = await collection.findOne({ _id: id }, { projection: { _id: 1 } });
  if (!doc) throw new ValidationError(`Unknown ${label} link: ${raw}`);
  return id;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const label = requireName(input.label, "Task label");
  const todoId = toObjectId(input.todoId, "todo id");
  const todo = await (await todos()).findOne(
    { _id: todoId },
    { projection: { _id: 1 } },
  );
  if (!todo) throw new ValidationError("Todo not found");

  const skillId = await resolveOptionalLink(input.skillId, "skill");
  const groupId = await resolveOptionalLink(input.groupId, "group");

  // New tasks append after the todo's existing ones.
  const count = await (await tasks()).countDocuments({ todoId });
  const now = new Date();
  const doc: Omit<TaskDoc, "_id"> = {
    todoId,
    label,
    done: input.done ?? false,
    sortOrder: normalizeSortOrder(input.sortOrder ?? count),
    skillId,
    groupId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await (await tasks()).insertOne(doc);
  return toTask({ ...doc, _id: result.insertedId });
}

export async function toggleTask(id: string): Promise<Task> {
  const _id = toObjectId(id, "task id");
  const collection = await tasks();
  const current = await collection.findOne({ _id });
  if (!current) throw new ValidationError("Task not found");

  const updated = await collection.findOneAndUpdate(
    { _id },
    { $set: { done: !current.done, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) throw new ValidationError("Task not found");
  return toTask(updated);
}

export async function deleteTask(id: string): Promise<void> {
  const result = await (await tasks()).deleteOne({
    _id: toObjectId(id, "task id"),
  });
  if (result.deletedCount === 0) throw new ValidationError("Task not found");
}
