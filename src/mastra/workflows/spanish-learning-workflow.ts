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
  description: "Identify and translate English words/phrases to Spanish",
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

    const response = await agent.generate([
      {
        role: "user",
        content: inputData.userMessage,
      },
    ]);

    // Extract tool result
    let translations: z.infer<typeof EnglishTranslationSchema> = {
      translations: [],
    };
    if (response.toolResults && response.toolResults.length > 0) {
      const toolResult = response.toolResults[0];
      if (toolResult.result && typeof toolResult.result === "object") {
        translations = toolResult.result as z.infer<
          typeof EnglishTranslationSchema
        >;
      }
    }

    return {
      ...translations,
      userMessage: inputData.userMessage,
    };
  },
});

/**
 * Step 2: Correct Spanish text
 */
const correctSpanishStep = createStep({
  id: "correct-spanish",
  description: "Analyze and correct Spanish text with explanations",
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

    const response = await agent.generate([
      {
        role: "user",
        content: inputData.userMessage,
      },
    ]);

    // Extract tool result
    if (response.toolResults && response.toolResults.length > 0) {
      const toolResult = response.toolResults[0];
      if (toolResult.result && typeof toolResult.result === "object") {
        return toolResult.result as z.infer<typeof CorrectionSchema>;
      }
    }

    // Fallback
    return {
      hasErrors: false,
      correctedText: inputData.userMessage,
      corrections: [],
    };
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

    const response = await agent.generate([
      {
        role: "user",
        content: `User message: ${
          inputData.userMessage
        }\nKnown Spanish words: ${inputData.knownSpanishWords.join(", ")}`,
      },
    ]);

    // Extract tool result
    if (response.toolResults && response.toolResults.length > 0) {
      const toolResult = response.toolResults[0];
      if (toolResult.result && typeof toolResult.result === "object") {
        return toolResult.result as z.infer<typeof ReplySchema>;
      }
    }

    // Fallback
    return {
      reply: "¡Hola! Thanks for practicing Spanish with me!",
      newSpanishWord: {
        word: "Hola",
        translation: "Hello",
        position: 1,
      },
      spanishWords: [
        {
          word: "Hola",
          translation: "Hello",
          position: 1,
          isKnown: false,
        },
      ],
    };
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

    // Translate the AI's reply to full Spanish
    const response = await agent.generate([
      {
        role: "user",
        content: `Translate this AI response to complete Spanish: "${inputData["generate-contextual-reply"].reply}"`,
      },
    ]);

    // Extract tool result
    let fullTranslation: z.infer<typeof FullTranslationSchema> = {
      fullSpanishSentence: inputData["generate-contextual-reply"].reply,
      difficulty: "beginner",
    };

    if (response.toolResults && response.toolResults.length > 0) {
      const toolResult = response.toolResults[0];
      if (toolResult.result && typeof toolResult.result === "object") {
        fullTranslation = toolResult.result as z.infer<
          typeof FullTranslationSchema
        >;
      }
    }

    return {
      "translate-english": inputData["translate-english"],
      "correct-spanish": inputData["correct-spanish"],
      "generate-contextual-reply": inputData["generate-contextual-reply"],
      "full-translation": fullTranslation,
    };
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
