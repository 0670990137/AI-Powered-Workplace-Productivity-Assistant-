import { z } from "zod";

export const assistantInputSchema = z.object({
  mode: z.enum(["email", "meeting", "task"]),
  fields: z.record(z.string()),
});

export type AssistantInput = z.infer<typeof assistantInputSchema>;
export type AssistantMode = AssistantInput["mode"];
