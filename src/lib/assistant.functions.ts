import { createServerFn } from "@tanstack/react-start";
import { assistantInputSchema } from "./assistant-schema";
import { runAssistant } from "./assistant.server";

export const generateAssistantOutput = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => assistantInputSchema.parse(input))
  .handler(async ({ data }) => runAssistant(data));
