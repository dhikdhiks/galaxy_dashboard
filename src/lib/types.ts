export const SKILL_STATUSES = [
  "not_started",
  "learning",
  "practiced",
  "mastered",
] as const;

export type SkillStatus = (typeof SKILL_STATUSES)[number];

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  groupId: string;
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

export interface GroupInput {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
}

export interface SkillInput {
  groupId: string;
  name: string;
  url: string;
  icon?: string | null;
  description?: string | null;
  status?: SkillStatus;
  progress?: number;
  sortOrder?: number;
}

/** Thrown for invalid user input so route handlers can return a 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/* --------------------------------- To-dos --------------------------------- */

export interface Todo {
  id: string;
  title: string;
  /** Scheduled time, null when the todo has no time set. */
  time: Date | null;
  sortOrder: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  todoId: string;
  label: string;
  done: boolean;
  sortOrder: number;
  /** Optional link to a skill (skills._id as hex). */
  skillId: string | null;
  /** Optional link to a group (groups._id as hex). */
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Task enriched with the names of its optional skill/group links. */
export interface TaskWithLinks extends Task {
  skillName: string | null;
  groupSlug: string | null;
  groupName: string | null;
}

export interface TodoWithTasks extends Todo {
  tasks: TaskWithLinks[];
  doneCount: number;
}

export interface TodoInput {
  title: string;
  time?: Date | null;
  sortOrder?: number;
  archived?: boolean;
}

export interface TaskInput {
  todoId: string;
  label: string;
  done?: boolean;
  sortOrder?: number;
  skillId?: string | null;
  groupId?: string | null;
}
