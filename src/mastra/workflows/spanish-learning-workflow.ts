import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import {
  EnglishTranslationSchema,
  CorrectionSchema,
  ReplySchema,
  FullTranslationSchema,
} from "../agents/spanish-agent";

/**
 * Schema for the complete Spanish learning response
 */
const SpanishLearningResponseSchema = z.object({
  englishTranslations: EnglishTranslationSchema,
  corrections: CorrectionSchema,
  contextualReply: ReplySchema,
  fullTranslation: FullTranslationSchema,
  userMessage: z.string(),
});

/**
 * Step 1: Translate English words to Spanish
 */
const translateEnglishStep = createStep({
  id: "translate-english",
  description: "Identify and translate English words to Spanish",
  inputSchema: z.object({
    userMessage: z.string(),
    knownSpanishWords: z.array(z.string()).default([]),
  }),
  outputSchema: EnglishTranslationSchema.extend({
    userMessage: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const agent = mastra?.getAgent("englishTranslationAgent");
    if (!agent) {
      throw new Error("English Translation Agent not found");
    }

    try {
      const response = await agent.generate([
        {
          role: "user",
          content: `Analyze this message: "${inputData.userMessage}"`,
        },
      ]);

      console.log("English Translation Agent Response:", response);

      // Check for tool results in the steps
      if (response.steps && response.steps.length > 0) {
        for (const step of response.steps) {
          if (step.toolResults && step.toolResults.length > 0) {
            const toolResult = step.toolResults[0];
            if (toolResult.result && typeof toolResult.result === "object") {
              const result = toolResult.result as z.infer<
                typeof EnglishTranslationSchema
              >;
              return {
                ...result,
                userMessage: inputData.userMessage,
              };
            }
            // Try parsing from content if result is a string
            if (typeof toolResult.result === "string") {
              try {
                const parsed = JSON.parse(toolResult.result);
                return {
                  ...parsed,
                  userMessage: inputData.userMessage,
                };
              } catch (e) {
                console.log(
                  "Failed to parse tool result:",
                  toolResult.result,
                  e
                );
              }
            }
          }
        }
      }

      console.log("No tool results found, returning empty translations");
      return {
        translations: [],
        userMessage: inputData.userMessage,
      };
    } catch (error) {
      console.error("Error in English Translation step:", error);
      throw error;
    }
  },
});

/**
 * Step 2: Analyze and correct Spanish text
 */
const correctSpanishStep = createStep({
  id: "correct-spanish",
  description: "Analyze Spanish text for errors and provide corrections",
  inputSchema: z.object({
    userMessage: z.string(),
    knownSpanishWords: z.array(z.string()).default([]),
  }),
  outputSchema: CorrectionSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const agent = mastra?.getAgent("spanishCorrectionAgent");
    if (!agent) {
      throw new Error("Spanish Correction Agent not found");
    }

    try {
      const response = await agent.generate([
        {
          role: "user",
          content: `Analyze this Spanish text: "${inputData.userMessage}"`,
        },
      ]);

      console.log("Spanish Correction Agent Response:", response);

      // Check for tool results in the steps
      if (response.steps && response.steps.length > 0) {
        for (const step of response.steps) {
          if (step.toolResults && step.toolResults.length > 0) {
            const toolResult = step.toolResults[0];
            if (toolResult.result && typeof toolResult.result === "object") {
              return toolResult.result as z.infer<typeof CorrectionSchema>;
            }
            // Try parsing from content if result is a string
            if (typeof toolResult.result === "string") {
              try {
                const parsed = JSON.parse(toolResult.result);
                return parsed;
              } catch (e) {
                console.log(
                  "Failed to parse tool result:",
                  toolResult.result,
                  e
                );
              }
            }
          }
        }
      }

      console.log("No tool results found, returning no corrections");
      return {
        hasErrors: false,
        correctedText: inputData.userMessage,
        corrections: [],
      };
    } catch (error) {
      console.error("Error in Spanish Correction step:", error);
      throw error;
    }
  },
});

/**
 * Step 3: Generate contextual reply using known vocabulary
 */
const generateContextualReplyStep = createStep({
  id: "generate-contextual-reply",
  description:
    "Generate reply using known Spanish vocabulary plus one new word",
  inputSchema: z.object({
    userMessage: z.string(),
    knownSpanishWords: z.array(z.string()).default([]),
  }),
  outputSchema: ReplySchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const agent = mastra?.getAgent("contextualReplyAgent");
    if (!agent) {
      throw new Error("Contextual Reply Agent not found");
    }

    try {
      const response = await agent.generate([
        {
          role: "user",
          content: `User message: ${
            inputData.userMessage
          }\nKnown Spanish words: ${inputData.knownSpanishWords.join(", ")}`,
        },
      ]);

      console.log("Contextual Reply Agent Response:", response);

      // Check for tool results in the steps
      if (response.steps && response.steps.length > 0) {
        for (const step of response.steps) {
          if (step.toolResults && step.toolResults.length > 0) {
            const toolResult = step.toolResults[0];
            if (toolResult.result && typeof toolResult.result === "object") {
              return toolResult.result as z.infer<typeof ReplySchema>;
            }
            // Try parsing from content if result is a string
            if (typeof toolResult.result === "string") {
              try {
                const parsed = JSON.parse(toolResult.result);
                return parsed;
              } catch (e) {
                console.log(
                  "Failed to parse tool result:",
                  toolResult.result,
                  e
                );
              }
            }
          }
        }
      }

      console.log("No tool results found in contextual reply");
      throw new Error("Contextual Reply Agent failed to generate response");
    } catch (error) {
      console.error("Error in Contextual Reply step:", error);
      throw error;
    }
  },
});

/**
 * Step 4: Generate full Spanish translation of the AI's reply
 */
const generateFullTranslationStep = createStep({
  id: "generate-full-translation",
  description: "Provide complete Spanish translation of the AI's reply",
  inputSchema: z.object({
    "translate-english": EnglishTranslationSchema.extend({
      userMessage: z.string(),
    }),
    "correct-spanish": CorrectionSchema,
    "generate-contextual-reply": ReplySchema,
  }),
  outputSchema: z.object({
    "translate-english": EnglishTranslationSchema.extend({
      userMessage: z.string(),
    }),
    "correct-spanish": CorrectionSchema,
    "generate-contextual-reply": ReplySchema,
    "full-translation": FullTranslationSchema,
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const agent = mastra?.getAgent("fullTranslationAgent");
    if (!agent) {
      throw new Error("Full Translation Agent not found");
    }

    try {
      // Translate the AI's reply to full Spanish
      const response = await agent.generate([
        {
          role: "user",
          content: `AI Reply to translate: "${inputData["generate-contextual-reply"].reply}"`,
        },
      ]);

      console.log("Full Translation Agent Response:", response);

      // Check for tool results in the steps
      if (response.steps && response.steps.length > 0) {
        for (const step of response.steps) {
          if (step.toolResults && step.toolResults.length > 0) {
            const toolResult = step.toolResults[0];
            if (toolResult.result && typeof toolResult.result === "object") {
              const result = toolResult.result as z.infer<
                typeof FullTranslationSchema
              >;
              return {
                "translate-english": inputData["translate-english"],
                "correct-spanish": inputData["correct-spanish"],
                "generate-contextual-reply":
                  inputData["generate-contextual-reply"],
                "full-translation": result,
              };
            }
            // Try parsing from content if result is a string
            if (typeof toolResult.result === "string") {
              try {
                const parsed = JSON.parse(toolResult.result);
                return {
                  "translate-english": inputData["translate-english"],
                  "correct-spanish": inputData["correct-spanish"],
                  "generate-contextual-reply":
                    inputData["generate-contextual-reply"],
                  "full-translation": parsed,
                };
              } catch (e) {
                console.log(
                  "Failed to parse full translation tool result:",
                  toolResult.result,
                  e
                );
              }
            }
          }
        }
      }

      console.log("No tool results found for full translation, using fallback");

      // Fallback - but this should be a proper translation, not just copying the reply
      return {
        "translate-english": inputData["translate-english"],
        "correct-spanish": inputData["correct-spanish"],
        "generate-contextual-reply": inputData["generate-contextual-reply"],
        "full-translation": {
          fullSpanishSentence: inputData["generate-contextual-reply"].reply,
          difficulty: "beginner",
        },
      };
    } catch (error) {
      console.error("Error in Full Translation step:", error);
      throw error;
    }
  },
});

/**
 * Final step: Combine all results
 */
const combineResultsStep = createStep({
  id: "combine-results",
  description: "Combine all analysis results into final response",
  inputSchema: z.object({
    "translate-english": EnglishTranslationSchema.extend({
      userMessage: z.string(),
    }),
    "correct-spanish": CorrectionSchema,
    "generate-contextual-reply": ReplySchema,
    "full-translation": FullTranslationSchema,
  }),
  outputSchema: SpanishLearningResponseSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    return {
      userMessage: inputData["translate-english"].userMessage,
      englishTranslations: {
        translations: inputData["translate-english"].translations,
      },
      corrections: inputData["correct-spanish"],
      contextualReply: inputData["generate-contextual-reply"],
      fullTranslation: inputData["full-translation"],
    };
  },
});

/**
 * Spanish Learning Workflow - Orchestrates multiple agents for comprehensive feedback
 */
const spanishLearningWorkflow = createWorkflow({
  id: "spanish-learning-workflow",
  inputSchema: z.object({
    userMessage: z.string().describe("The user's message to analyze"),
    knownSpanishWords: z
      .array(z.string())
      .default([])
      .describe("Spanish words the user has used correctly"),
  }),
  outputSchema: SpanishLearningResponseSchema,
})
  .parallel([
    translateEnglishStep,
    correctSpanishStep,
    generateContextualReplyStep,
  ])
  .then(generateFullTranslationStep)
  .then(combineResultsStep);

spanishLearningWorkflow.commit();

export { spanishLearningWorkflow, SpanishLearningResponseSchema };
