import { Collection, Filter, ObjectId, WithId } from "mongodb";

import { getDb } from "./mongodb";
import {
  Group,
  GroupInput,
  SKILL_STATUSES,
  Skill,
  SkillInput,
  SkillStatus,
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

async function groups(): Promise<Collection<GroupDoc>> {
  return (await getDb()).collection<GroupDoc>("groups");
}

async function skills(): Promise<Collection<SkillDoc>> {
  return (await getDb()).collection<SkillDoc>("skills");
}

function toGroup(doc: WithId<GroupDoc>): Group {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}

function toSkill(doc: WithId<SkillDoc>): Skill {
  const { _id, groupId, ...rest } = doc;
  return { id: _id.toHexString(), groupId: groupId.toHexString(), ...rest };
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
  const docs = await (await groups())
    .find({})
    .sort({ sortOrder: 1, name: 1 })
    .toArray();
  return docs.map(toGroup);
}

export async function getGroupById(id: string): Promise<Group | null> {
  const doc = await (await groups()).findOne({ _id: toObjectId(id, "group id") });
  return doc ? toGroup(doc) : null;
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const doc = await (await groups()).findOne({ slug });
  return doc ? toGroup(doc) : null;
}

/**
 * Minimal existence probe for `src/proxy.ts`. Projects only `_id` so it stays
 * cheap enough to run on every `/groups/*` request (the slug index makes it a
 * single indexed point lookup).
 */
export async function groupExists(slug: string): Promise<boolean> {
  const doc = await (await groups()).findOne(
    { slug },
    { projection: { _id: 1 } },
  );
  return doc !== null;
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
