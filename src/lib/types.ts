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
