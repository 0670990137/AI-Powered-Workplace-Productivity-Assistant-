import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Mail, ListChecks, CalendarClock, ShieldCheck, Sparkles } from "lucide-react";
import { generateAssistantOutput } from "@/lib/assistant.functions";
import type { AssistantMode } from "@/lib/assistant-schema";
import { OutputPanel } from "@/components/OutputPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deskwork AI — Email, Meeting & Task Assistant" },
      {
        name: "description",
        content:
          "Turn rough notes into ready-to-send emails, meeting decision records and sequenced task plans. Built with structured prompts and responsible-AI guardrails.",
      },
      { property: "og:title", content: "Deskwork AI — Email, Meeting & Task Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarise meetings and plan tasks in seconds, with every output flagged for human review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Field = {
  name: string;
  label: string;
  placeholder: string;
  type?: "textarea" | "select";
  options?: string[];
  hint?: string;
  rows?: number;
};

type Tool = {
  id: AssistantMode;
  name: string;
  tagline: string;
  icon: typeof Mail;
  saves: string;
  fields: Field[];
  example: Record<string, string>;
  required: string;
};

const TOOLS: Tool[] = [
  {
    id: "email",
    name: "Email writer",
    tagline: "Purpose in, send-ready draft out",
    icon: Mail,
    saves: "~15 min per email",
    required: "purpose",
    fields: [
      {
        name: "purpose",
        label: "What is this email for?",
        placeholder: "Ask the vendor for a revised quote and push the deadline out by one week",
        type: "textarea",
        rows: 3,
      },
      { name: "recipient", label: "Recipient", placeholder: "Account manager at our print supplier" },
      {
        name: "audience",
        label: "Audience type",
        type: "select",
        placeholder: "",
        hint: "Changes vocabulary, formality and how the ask is framed.",
        options: [
          "Client",
          "Manager",
          "Team / colleague",
          "Vendor / supplier",
          "External stakeholder / partner",
        ],
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        placeholder: "",
        options: [
          "formal",
          "informal",
          "persuasive",
          "professional and warm",
          "direct and brief",
          "firm but polite (escalation)",
          "apologetic",
        ],
      },

      {
        name: "length",
        label: "Length",
        type: "select",
        placeholder: "",
        options: [
          "short (under 180 words)",
          "medium (180-300 words)",
          "detailed (300-450 words)",
        ],
      },
      {
        name: "keyPoints",
        label: "Key points to include",
        placeholder:
          "- Original quote was R48 000\n- Budget cap is R42 000\n- Need response by Friday",
        type: "textarea",
        rows: 4,
        hint: "The model is instructed not to add facts beyond these.",
      },
    ],
    example: {
      purpose:
        "Ask the print supplier for a revised quote within budget and confirm a new delivery date",
      recipient: "Account manager at our print supplier",
      tone: "firm but polite (escalation)",
      length: "short (under 180 words)",
      keyPoints:
        "- Original quote was R48 000, our approved cap is R42 000\n- We need 2 500 booklets, not 3 000\n- Delivery must land before the 18th\n- Ask for a revised quote by Friday",
    },
  },
  {
    id: "meeting",
    name: "Meeting summariser",
    tagline: "Messy notes into a decision record",
    icon: CalendarClock,
    saves: "~40 min per meeting",
    required: "notes",
    fields: [
      {
        name: "context",
        label: "Meeting context",
        placeholder: "Weekly ops stand-up, 6 attendees, 45 minutes",
      },
      {
        name: "notes",
        label: "Raw notes or transcript",
        placeholder: "Paste anything — bullet fragments, typos, transcript output...",
        type: "textarea",
        rows: 12,
        hint: "Pasted content is treated as data only, never as instructions to the model.",
      },
    ],
    example: {
      context: "Q3 ops review, 5 attendees, 50 minutes",
      notes: `Thabo: warehouse backlog still ~400 orders, mostly the Cape route
Nadia - courier contract expires end of Sept, she'll get 2 more quotes
agreed we move to the new courier IF quote is under current rate + 5%
Sipho asked about the returns portal, dev says maybe October? not confirmed
Nadia: customer complaints up 12% last month, mostly delivery delays
decided: pause the Durban expansion until backlog is under 100
someone said we should hire 2 temps for packing - budget unclear
action: Thabo to send backlog dashboard link to everyone by Wed
Nadia to bring courier quotes to next week's meeting
open question: who owns the returns portal comms?`,
    },
  },
  {
    id: "task",
    name: "Task planner",
    tagline: "Vague goal into a sequenced plan",
    icon: ListChecks,
    saves: "~30 min per plan",
    required: "goal",
    fields: [
      {
        name: "goal",
        label: "Goal or project",
        placeholder: "Launch the new onboarding flow for enterprise customers",
        type: "textarea",
        rows: 3,
      },
      { name: "deadline", label: "Deadline", placeholder: "Friday 21st, end of day" },
      { name: "capacity", label: "Capacity available", placeholder: "Me plus one designer, ~4 hours a day" },
      {
        name: "constraints",
        label: "Constraints & dependencies",
        placeholder: "Legal must approve copy; the API change ships only next week",
        type: "textarea",
        rows: 4,
      },
    ],
    example: {
      goal: "Run a company-wide security awareness training and prove completion for the audit",
      deadline: "In three weeks, before the audit on the 30th",
      capacity: "Just me, about 5 hours a week, plus HR for scheduling",
      constraints:
        "Training content must be approved by legal; 120 staff across 3 offices; audit needs signed attendance records",
    },
  },
];

function Index() {
  const [activeId, setActiveId] = useState<AssistantMode>("email");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateAssistantOutput);

  const tool = TOOLS.find((t) => t.id === activeId)!;

  const mutation = useMutation({
    mutationFn: (fields: Record<string, string>) =>
      generate({ data: { mode: activeId, fields } }),
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again."),
  });

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const switchTool = (id: AssistantMode) => {
    setActiveId(id);
    setValues({});
    setError(null);
    mutation.reset();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!values[tool.required]?.trim()) {
      setError("Please fill in the first field so the assistant has something to work from.");
      return;
    }
    mutation.mutate(values);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-[var(--shadow-raised)]">
          <Sparkles className="size-3.5 text-accent" />
          Workplace AI assistant
        </div>
        <h1 className="max-w-2xl text-4xl leading-tight md:text-5xl">
          Three hours of admin, done before your coffee cools.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Deskwork AI handles the writing tasks that eat professional time: drafting email,
          turning meeting chaos into decisions, and breaking goals into a plan. Every draft is
          structured, sourced from your input only, and flagged for your review.
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {TOOLS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTool(item.id)}
              className={`panel flex flex-col items-start gap-1 p-4 text-left transition-all ${
                isActive
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className={isActive ? "size-4 text-accent" : "size-4 text-muted-foreground"} />
                <span className="text-sm font-semibold">{item.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">{item.tagline}</span>
              <span className="mt-1 label-caps">Saves {item.saves}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form onSubmit={submit} className="panel h-fit p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl">{tool.name}</h2>
            <button
              type="button"
              onClick={() => setValues(tool.example)}
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              Load example
            </button>
          </div>

          <div className="space-y-4">
            {tool.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="label-caps mb-1.5 block">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    rows={field.rows ?? 4}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none transition-shadow placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? field.options?.[0] ?? ""}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring"
                  />
                )}
                {field.hint ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Working on it…
              </>
            ) : (
              <>Generate draft</>
            )}
          </button>

          {error ? (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </form>

        <div>
          {mutation.data?.text ? (
            <OutputPanel text={mutation.data.text} />
          ) : (
            <div className="panel flex h-full min-h-72 flex-col justify-center gap-3 p-8 text-center">
              <div className="mx-auto h-px w-16 rule-accent" />
              <p className="text-sm text-muted-foreground">
                Your structured draft appears here, split into sections you can copy one at a
                time — including a list of anything the assistant could not verify.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="panel mt-10 p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-xl">
          <ShieldCheck className="size-4 text-accent" />
          How this stays responsible
        </h2>
        <div className="mt-4 grid gap-5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label-caps mb-1">No invented facts</p>
            Every prompt forbids fabricating names, figures or dates. Gaps are listed under
            "Needs confirmation" instead of guessed.
          </div>
          <div>
            <p className="label-caps mb-1">Human stays the author</p>
            Output is labelled a draft, split for review, and never auto-sent anywhere.
          </div>
          <div>
            <p className="label-caps mb-1">Data minimisation</p>
            Nothing is stored. Notes are processed for one request only, and sensitive
            identifiers are redacted in the output.
          </div>
          <div>
            <p className="label-caps mb-1">Injection resistant</p>
            Pasted notes are wrapped and treated strictly as content, so instructions hidden in a
            transcript are not obeyed.
          </div>
        </div>
      </section>
    </main>
  );
}
