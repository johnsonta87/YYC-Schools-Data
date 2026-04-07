import OpenAI from "openai";
import { v } from "convex/values";
import { action } from "./_generated/server";

const schoolValidator = v.object({
  id: v.string(),
  name: v.string(),
  board: v.string(),
  grades: v.string(),
  address: v.string(),
  city: v.string(),
  quadrant: v.string(),
  province: v.string(),
  postalCode: v.string(),
  phone: v.string(),
  email: v.string(),
  location: v.string(),
  mapUrl: v.union(v.string(), v.null()),
});

function formatSchoolFacts(school: {
  name: string;
  board: string;
  grades: string;
  address: string;
  city: string;
  quadrant: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  location: string;
  mapUrl: string | null;
}) {
  return [
    `School name: ${school.name}`,
    `Board: ${school.board}`,
    `Grades: ${school.grades}`,
    `Address: ${school.address || "Not listed"}`,
    `City: ${school.city || "Not listed"}`,
    `Quadrant: ${school.quadrant || "Not listed"}`,
    `Province: ${school.province || "Not listed"}`,
    `Postal code: ${school.postalCode || "Not listed"}`,
    `Phone: ${school.phone || "Not listed"}`,
    `Email: ${school.email || "Not listed"}`,
    `Coordinates: ${school.location || "Not listed"}`,
    `Map URL: ${school.mapUrl ?? "Not listed"}`,
  ].join("\n");
}

const outOfScopeResponse =
  "I can only answer questions about the selected school.";

function getOpenAiApiKey() {
  return (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>
      }
    }
  ).process?.env?.OPENAI_API_KEY
}

export const askSchool = action({
  args: {
    prompt: v.string(),
    school: schoolValidator,
  },
  handler: async (_ctx, args) => {
    const prompt = args.prompt.trim();

    if (!prompt) {
      throw new Error("Prompt is required.");
    }

    if (prompt.length > 500) {
      throw new Error("Prompt must be 500 characters or fewer.");
    }

    const apiKey = getOpenAiApiKey();

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured for the AI drawer.')
    }

    const openai = new OpenAI({ apiKey });
    const schoolFacts = formatSchoolFacts(args.school);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 400,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a school information assistant for a Calgary schools app. Do not provide information on unrelated information. Keep answers concise, factual, and clearly tied to the selected school.\n\n" +
                `Selected school facts:\n${schoolFacts}`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const answerText = typeof response.output_text === "string" ? response.output_text : "";
    const answer = answerText.trim() || outOfScopeResponse;

    return {
      answer,
      outOfScopeResponse,
    };
  },
});

