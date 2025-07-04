import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Schema for English word translations
 */
export const EnglishTranslationSchema = z.object({
  translations: z.array(
    z.object({
      englishWord: z.string().describe("English word or phrase"),
      spanishTranslation: z.string().describe("Spanish translation"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence level of translation"),
    })
  ),
});

/**
 * Schema for Spanish correction analysis
 */
export const CorrectionSchema = z.object({
  hasErrors: z.boolean().describe("Whether the Spanish text contains errors"),
  correctedText: z.string().describe("Corrected version of the Spanish text"),
  corrections: z.array(
    z.object({
      original: z.string().describe("Original incorrect text"),
      corrected: z.string().describe("Corrected text"),
      errorType: z.string().describe("Type of error (grammar, spelling, etc.)"),
      explanation: z.string().describe("Brief explanation of the correction"),
    })
  ),
});

/**
 * Schema for user's Spanish vocabulary tracking
 */
export const VocabularySchema = z.object({
  knownWords: z
    .array(z.string())
    .describe("Spanish words the user has used correctly"),
  struggledWords: z
    .array(z.string())
    .describe("Spanish words the user has made errors with"),
});

/**
 * Schema for contextual reply generation
 */
export const ReplySchema = z.object({
  reply: z
    .string()
    .describe("Conversational response mixing Spanish and English"),
  newSpanishWord: z.object({
    word: z.string().describe("The one new Spanish word introduced"),
    translation: z.string().describe("English translation of the new word"),
    position: z.number().describe("Character position in the reply"),
  }),
  spanishWords: z.array(
    z.object({
      word: z.string().describe("Spanish word in the reply"),
      translation: z.string().describe("English translation"),
      position: z.number().describe("Character position in the reply"),
      isKnown: z
        .boolean()
        .describe("Whether user has used this word correctly before"),
    })
  ),
});

/**
 * Schema for full Spanish translation
 */
export const FullTranslationSchema = z.object({
  fullSpanishSentence: z
    .string()
    .describe("Complete Spanish translation of the user's message"),
  difficulty: z
    .string()
    .describe("Difficulty level: beginner, intermediate, advanced"),
});

/**
 * Tool for translating English words to Spanish
 */
export const englishTranslationTool = createTool({
  id: "translate-english-words",
  description: "Identify and translate English words/phrases to Spanish",
  inputSchema: z.object({
    userMessage: z.string().describe("User's message to analyze"),
  }),
  outputSchema: EnglishTranslationSchema,
  execute: async ({ context }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: EnglishTranslationSchema,
      system: `You are a Spanish translation expert. Identify English words or phrases in the user's message and provide Spanish translations.
      
Focus on:
- Individual words and common phrases
- Provide accurate, contextually appropriate translations
- Rate confidence level based on how certain the translation is`,
      prompt: `Analyze this message and identify English words/phrases with their Spanish translations: "${context.userMessage}"`,
    });
    return object;
  },
});

/**
 * Tool for correcting Spanish text
 */
export const spanishCorrectionTool = createTool({
  id: "correct-spanish-text",
  description: "Analyze and correct Spanish text, highlighting errors",
  inputSchema: z.object({
    userMessage: z.string().describe("User's message containing Spanish text"),
  }),
  outputSchema: CorrectionSchema,
  execute: async ({ context }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: CorrectionSchema,
      system: `You are a Spanish grammar expert. Analyze Spanish text for errors and provide corrections.

Focus on:
- Grammar mistakes (verb conjugation, gender agreement, etc.)
- Spelling errors
- Word order issues
- Provide clear explanations for each correction`,
      prompt: `Analyze this message for Spanish errors and provide corrections: "${context.userMessage}"`,
    });
    return object;
  },
});

/**
 * Tool for generating contextual replies using known vocabulary
 */
export const contextualReplyTool = createTool({
  id: "generate-contextual-reply",
  description:
    "Generate a reply using user's known Spanish vocabulary plus one new word",
  inputSchema: z.object({
    userMessage: z.string().describe("User's message"),
    knownSpanishWords: z
      .array(z.string())
      .describe("Spanish words user has used correctly"),
  }),
  outputSchema: ReplySchema,
  execute: async ({ context }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ReplySchema,
      system: `You are a Spanish learning conversation partner. Your role is to respond to the user in a way that helps them learn Spanish gradually.

CRITICAL RULES:
1. Respond conversationally to what the user said
2. Use ONLY Spanish words from the knownSpanishWords list (if any are provided)
3. Use English for all other words EXCEPT introduce exactly ONE new Spanish word
4. The new Spanish word should be simple and relevant to the conversation
5. Mark the new word clearly and provide its translation
6. Keep responses encouraging and natural
7. Provide accurate position data for ALL Spanish words in your response

EXAMPLE:
User says: "hola, como te va!"
Known words: ["hola", "como"]
Your response might be: "¡Hola! I'm doing great, gracias! How was your día today?"
(Here "gracias" is the new word, "día" would be too many new words)

Be conversational and helpful while following these vocabulary constraints strictly.`,
      prompt: `User message: "${context.userMessage}"
Known Spanish words: ${
        context.knownSpanishWords.length > 0
          ? context.knownSpanishWords.join(", ")
          : "none yet"
      }

Generate an encouraging reply that responds to their message while following the vocabulary learning rules.`,
    });
    return object;
  },
});

/**
 * Tool for full Spanish translation
 */
export const fullTranslationTool = createTool({
  id: "full-spanish-translation",
  description: "Provide complete Spanish translation of the user's message",
  inputSchema: z.object({
    userMessage: z.string().describe("User's message to translate"),
  }),
  outputSchema: FullTranslationSchema,
  execute: async ({ context }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: FullTranslationSchema,
      system: `You are a Spanish translation expert. Provide a complete, natural Spanish translation of the user's message.

Focus on:
- Natural, conversational Spanish
- Appropriate register for the context
- Assess difficulty level for Spanish learners`,
      prompt: `Translate this complete message to Spanish: "${context.userMessage}"`,
    });
    return object;
  },
});

/**
 * English Translation Agent - Identifies English words and translates them
 */
export const englishTranslationAgent = new Agent({
  name: "English Translation Agent",
  instructions: `You specialize in identifying English words and phrases in mixed-language text and providing accurate Spanish translations. Always use the translate-english-words tool to provide structured output.`,
  model: openai("gpt-4o-mini"),
  tools: { englishTranslationTool },
});

/**
 * Spanish Correction Agent - Analyzes and corrects Spanish text
 */
export const spanishCorrectionAgent = new Agent({
  name: "Spanish Correction Agent",
  instructions: `You are an expert in Spanish grammar and spelling. Analyze Spanish text for errors and provide detailed corrections with explanations. Always use the correct-spanish-text tool.`,
  model: openai("gpt-4o-mini"),
  tools: { spanishCorrectionTool },
});

/**
 * Contextual Reply Agent - Generates replies using known vocabulary
 */
export const contextualReplyAgent = new Agent({
  name: "Contextual Reply Agent",
  instructions: `You are a Spanish learning conversation partner. Your job is to help users learn Spanish gradually by responding to their messages using mostly English but strategically introducing Spanish words.

ALWAYS use the generate-contextual-reply tool to create responses that:
- Respond naturally to what the user said
- Use Spanish words they already know (from their vocabulary list)
- Use English for everything else, EXCEPT introduce exactly one new Spanish word
- Make the conversation encouraging and supportive

You must ALWAYS call the generate-contextual-reply tool - never respond directly.`,
  model: openai("gpt-4o-mini"),
  tools: { contextualReplyTool },
});

/**
 * Full Translation Agent - Provides complete Spanish translations
 */
export const fullTranslationAgent = new Agent({
  name: "Full Translation Agent",
  instructions: `You provide complete, natural Spanish translations of user messages. Focus on conversational, appropriate Spanish that learners can aspire to. Always use the full-spanish-translation tool.`,
  model: openai("gpt-4o-mini"),
  tools: { fullTranslationTool },
});
