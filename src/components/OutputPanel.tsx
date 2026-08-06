import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

type Section = { heading: string; body: string[] };

function parseSections(text: string): Section[] {
  const known = [
    "SUBJECT",
    "EMAIL",
    "WHY THIS WORKS",
    "SUMMARY",
    "DECISIONS",
    "ACTION ITEMS",
    "RISKS AND OPEN QUESTIONS",
    "FOLLOW-UP EMAIL",
    "OBJECTIVE",
    "PLAN",
    "SUGGESTED SEQUENCE",
    "RISKS",
    "NEEDS CONFIRMATION",
  ];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/[*#`]/g, "").trimEnd();
    const match = known.find((heading) => line.trim().toUpperCase() === heading);
    if (match) {
      current = { heading: match, body: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { heading: "RESULT", body: [] };
      sections.push(current);
    }
    current.body.push(line);
  }

  return sections
    .map((section) => ({ ...section, body: trimBlank(section.body) }))
    .filter((section) => section.body.length > 0);
}

function trimBlank(lines: string[]) {
  const copy = [...lines];
  while (copy.length && !copy[0]?.trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1]?.trim()) copy.pop();
  return copy;
}

export function OutputPanel({ text }: { text: string }) {
  const sections = useMemo(() => parseSections(text), [text]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="label-caps">Draft output — review before use</span>
        <button
          type="button"
          onClick={() => copy("all", text)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
        >
          {copied === "all" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied === "all" ? "Copied" : "Copy all"}
        </button>
      </div>

      {sections.map((section) => {
        const value = section.body.join("\n");
        const isCaution = section.heading === "NEEDS CONFIRMATION";
        return (
          <section key={section.heading} className="panel overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={
                    isCaution
                      ? "size-1.5 rounded-full bg-destructive"
                      : "size-1.5 rounded-full rule-accent"
                  }
                />
                <h3 className="text-sm font-semibold tracking-wide text-surface-foreground">
                  {section.heading}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => copy(section.heading, value)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied === section.heading ? "Copied" : "Copy"}
              </button>
            </header>
            <div className="px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">
              {value}
            </div>
          </section>
        );
      })}
    </div>
  );
}
