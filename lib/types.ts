export type FindingCategory =
  | "security"
  | "performance"
  | "best-practice"
  | "refactoring";

export type Severity = "high" | "medium" | "low";

export interface ReviewFinding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  lines: number[];
  suggestion: string;
}

export interface CodeAnalysis {
  summary: string;
  language: string;
  findings: ReviewFinding[];
  generatedAt: string;
}

export interface Comment {
  id: string;
  sessionId: string;
  line: number;
  author: string;
  authorColor: string;
  body: string;
  createdAt: string;
}

export interface Cursor {
  line: number;
  col: number;
}

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  cursor?: Cursor;
  updatedAt: number;
}

export interface ReviewSession {
  id: string;
  title: string;
  code: string;
  language: string;
  analysis?: CodeAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoteMap {
  [findingId: string]: number;
}
