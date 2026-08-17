export interface LanguageOption {
  id: string;
  label: string;
  prism: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: "typescript", label: "TypeScript", prism: "typescript" },
  { id: "javascript", label: "JavaScript", prism: "javascript" },
  { id: "python", label: "Python", prism: "python" },
  { id: "go", label: "Go", prism: "go" },
  { id: "rust", label: "Rust", prism: "rust" },
  { id: "java", label: "Java", prism: "java" },
  { id: "c", label: "C", prism: "c" },
  { id: "cpp", label: "C++", prism: "cpp" },
  { id: "csharp", label: "C#", prism: "csharp" },
  { id: "ruby", label: "Ruby", prism: "ruby" },
  { id: "php", label: "PHP", prism: "php" },
  { id: "bash", label: "Bash", prism: "bash" },
  { id: "json", label: "JSON", prism: "json" },
  { id: "yaml", label: "YAML", prism: "yaml" },
  { id: "html", label: "HTML", prism: "markup" },
  { id: "css", label: "CSS", prism: "css" },
  { id: "sql", label: "SQL", prism: "sql" },
];

export function prismFor(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.prism ?? "typescript";
}
