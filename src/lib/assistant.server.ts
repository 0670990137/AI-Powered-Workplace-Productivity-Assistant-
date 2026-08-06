import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { buildEmailPrompt, buildMeetingPrompt, buildTaskPrompt } from "./prompts.server";
import type { AssistantInput } from "./assistant-schema";

const MODEL = "google/gemini-3.6-flash";
const MAX_INPUT_CHARS = 24000;

function buildMessages(data: AssistantInput) {
  const f = data.fields;
  const clip = (value: string | undefined) => (value ?? "").slice(0, MAX_INPUT_CHARS);

  if (data.mode === "email") {
    return buildEmailPrompt({
      purpose: clip(f['purpose']),
      recipient: clip(f['recipient']),
      tone: clip(f['tone']) || "professional and warm",
      keyPoints: clip(f['keyPoints']),
      length: clip(f['length']) || "short (under 180 words)",
    });
  }

  if (data.mode === "meeting") {
    return buildMeetingPrompt({
      notes: clip(f['notes']),
      context: clip(f['context']),
    });
  }

  return buildTaskPrompt({
    goal: clip(f['goal']),
    deadline: clip(f['deadline']),
    capacity: clip(f['capacity']),
    constraints: clip(f['constraints']),
  });
}

export async function runAssistant(data: AssistantInput) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const { system, prompt } = buildMessages(data);
  const gateway = createLovableAiGatewayProvider(apiKey);

  try {
    const result = streamText({
      model: gateway(MODEL),
      system,
      prompt,
      temperature: 0.4,
    });
    const text = await result.text;
    return { text: text.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("429")) {
      throw new Error("Too many requests right now. Please wait a moment and try again.");
    }
    if (message.includes("402")) {
      throw new Error("AI credits are exhausted for this workspace. Add credits to continue.");
    }
    throw new Error(`The AI request failed: ${message}`);
  }
}
