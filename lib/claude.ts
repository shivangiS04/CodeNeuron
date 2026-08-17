import Anthropic from "@anthropic-ai/sdk";
import {
  CodeAnalysis,
  FindingCategory,
  ReviewFinding,
  Severity,
} from "./types";
import { randomId } from "./utils";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

function findLines(re: RegExp, code: string): number[] {
  const lines = code.split("\n");
  const out: number[] = [];
  lines.forEach((l, i) => {
    if (re.test(l)) out.push(i + 1);
  });
  return out;
}

/**
 * Deterministic heuristic analysis used when no Claude API key is present.
 * Keeps the app fully usable/demoable without external credentials.
 */
export function heuristicAnalysis(code: string, language: string): CodeAnalysis {
  const findings: ReviewFinding[] = [];
  const add = (
    category: FindingCategory,
    severity: Severity,
    title: string,
    description: string,
    lines: number[],
    suggestion: string
  ) => {
    if (lines.length === 0) return;
    findings.push({ id: randomId(), category, severity, title, description, lines, suggestion });
  };

  add(
    "security",
    "high",
    "Dangerous eval() usage",
    "eval() executes arbitrary strings as code. It is a common vector for code injection and makes the behavior hard to reason about.",
    findLines(/\beval\s*\(/, code),
    "Replace eval() with JSON.parse for data, or refactor to avoid dynamic evaluation entirely."
  );
  add(
    "security",
    "high",
    "innerHTML / outerHTML injection risk",
    "Assigning user-controlled input to innerHTML can lead to XSS (cross-site scripting) attacks.",
    findLines(/innerHTML\s*=/, code),
    "Use textContent or a safe DOM builder that escapes untrusted input."
  );
  add(
    "security",
    "medium",
    "Possible hardcoded secret",
    "Detected literals that look like passwords, tokens or API keys in source code.",
    findLines(/(password\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|token\s*[:=])/i, code),
    "Move secrets to environment variables and rotate any that were committed."
  );

  const n = (code.match(/console\.(log|debug)\b/g) || []).length;
  if (n > 0)
    add(
      "best-practice",
      "low",
      `${n} console statement(s) left in code`,
      "Console logging is fine for local debugging but noisy and slow in production paths.",
      findLines(/console\.(log|debug)\b/, code),
      "Use a structured logger gated by environment, or remove the statements before shipping."
    );
  add(
    "best-practice",
    "low",
    "TODO / FIXME markers present",
    "Unfinished markers indicate incomplete or unresolved work that should be tracked.",
    findLines(/TODO|FIXME/i, code),
    "Resolve the item or file a ticket so it is not silently forgotten."
  );
  add(
    "performance",
    "medium",
    "Sequential I/O in a loop",
    "Awaiting inside a loop performs network/database work serially, stretching total latency by the loop length.",
    findLines(/await[^;\n]*(for|while)|for\s*\([^)]*\)[\s\S]*?await/, code),
    "Batch the requests or run them with Promise.all and limited concurrency."
  );
  add(
    "refactoring",
    "low",
    "Long function signature / high cyclomatic pressure",
    "Functions with many parameters and branches are harder to test and maintain.",
    findLines(/\)\s*\{/, code).slice(0, 3),
    "Consider extracting sub-behaviors into smaller, single-purpose functions."
  );

  return {
    summary:
      "Heuristic analysis completed (no Claude API key configured). Several potential issues were detected — review each finding and vote on its relevance.",
    language,
    findings,
    generatedAt: new Date().toISOString(),
  };
}

function extractJson(text: string): CodeAnalysis | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return {
      summary: parsed.summary || "",
      language: parsed.language || "",
      generatedAt: parsed.generatedAt || new Date().toISOString(),
      findings: Array.isArray(parsed.findings)
        ? parsed.findings.map((f: Partial<ReviewFinding>) => ({
            id: f.id || randomId(),
            category: (f.category as FindingCategory) || "best-practice",
            severity: (f.severity as Severity) || "low",
            title: f.title || "Untitled",
            description: f.description || "",
            lines: Array.isArray(f.lines) ? f.lines : [],
            suggestion: f.suggestion || "",
          }))
        : [],
    };
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are CodeNeuron, an expert senior software engineer reviewing code.
Analyze the provided code and respond with ONLY a JSON object (no prose, no markdown fences)
with this exact shape:
{
  "summary": "string - 1-3 sentence overall assessment",
  "language": "string - detected language",
  "findings": [
    {
      "category": "security" | "performance" | "best-practice" | "refactoring",
      "severity": "high" | "medium" | "low",
      "title": "short title",
      "description": "why it matters",
      "lines": [integer 1-based line numbers affected],
      "suggestion": "concrete fix"
    }
  ]
}
Return 4-10 findings. Be specific and cite real line numbers. Prefer concrete, actionable advice.`;

export async function analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return heuristicAnalysis(code, language);

  const anthropic = new Anthropic({ apiKey });
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Language: ${language || "unknown"}\n\nCode to review:\n${code}`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const parsed = extractJson(text);
    if (parsed) {
      parsed.language = language || parsed.language;
      return parsed;
    }
    return heuristicAnalysis(code, language);
  } catch (err) {
    console.error("Claude analysis failed, falling back to heuristic:", err);
    return heuristicAnalysis(code, language);
  }
}
