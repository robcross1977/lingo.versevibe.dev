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
      system: `You are a Spanish translation expert. Analyze text and identify English words/phrases with their Spanish translations.

REQUIRED JSON STRUCTURE:
{
  "translations": [
    {
      "englishWord": "hello",
      "spanishTranslation": "hola", 
      "confidence": 0.95
    }
  ]
}

RULES:
- Only identify clear English words/phrases
- Provide accurate Spanish translations
- Confidence should be 0.0 to 1.0 (1.0 = completely confident)
- If no English words found, return empty array
- Focus on individual words and common phrases`,
      prompt: `Analyze this message and identify English words/phrases with their Spanish translations: "${context.userMessage}"
      
Return a JSON object with the translations array.`,
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
      system: `You are a Spanish learning conversation partner. Generate a MOSTLY ENGLISH response with strategic Spanish words.

CRITICAL: Your reply should be PRIMARILY IN ENGLISH with only specific Spanish words mixed in.

LANGUAGE RULES (VERY IMPORTANT):
1. Write your response in ENGLISH as the base language
2. ONLY replace English words with Spanish IF they are in the knownSpanishWords list
3. Add exactly ONE new Spanish word (simple and relevant)
4. Everything else MUST remain in ENGLISH

EXAMPLE (if knownSpanishWords = ["hola"]):
❌ WRONG: "¡Hola! Estoy muy bien, gracias. ¿Cómo estás tú?"
✅ CORRECT: "¡Hola! I'm doing great, gracias! How are you?"

JSON STRUCTURE REQUIREMENTS:
- "reply": string with your MOSTLY ENGLISH conversational response
- "newSpanishWord": object with "word", "translation", and "position" (number)
- "spanishWords": array of objects, each with "word", "translation", "position" (number), and "isKnown" (boolean)

CONVERSATION RULES:
1. Respond naturally to what the user said IN ENGLISH
2. Use ONLY Spanish words from the knownSpanishWords list (mark these as "isKnown": true)
3. Keep ALL other words in ENGLISH except introduce exactly ONE new Spanish word (mark as "isKnown": false)
4. The new Spanish word should be simple and relevant
5. Calculate accurate character positions for ALL Spanish words
6. ALWAYS include the "isKnown" boolean field for every Spanish word

EXAMPLE OUTPUT:
{
  "reply": "¡Hola! I'm doing great, gracias! How are you?",
  "newSpanishWord": {
    "word": "gracias",
    "translation": "thank you",
    "position": 25
  },
  "spanishWords": [
    {
      "word": "Hola",
      "translation": "Hello",
      "position": 1,
      "isKnown": true
    },
    {
      "word": "gracias",
      "translation": "thank you", 
      "position": 25,
      "isKnown": false
    }
  ]
}

Keep responses short, encouraging, and conversational - but MOSTLY IN ENGLISH!`,
      prompt: `User message: "${context.userMessage}"
Known Spanish words: ${
        context.knownSpanishWords.length > 0
          ? context.knownSpanishWords.join(", ")
          : "none yet"
      }

Generate a conversational reply that is MOSTLY ENGLISH with only the known Spanish words plus one new Spanish word. Follow the exact JSON structure above.`,
    });
    return object;
  },
});

/**
 * Tool for full Spanish translation
 */
export const fullTranslationTool = createTool({
  id: "full-spanish-translation",
  description: "Provide complete Spanish translation of the AI's reply",
  inputSchema: z.object({
    aiReply: z.string().describe("AI's reply to translate to complete Spanish"),
  }),
  outputSchema: FullTranslationSchema,
  execute: async ({ context }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: FullTranslationSchema,
      system: `You are a Spanish translation expert. Your job is to translate mixed English/Spanish AI responses into complete, natural Spanish.

REQUIRED JSON STRUCTURE:
{
  "fullSpanishSentence": "Complete Spanish translation here",
  "difficulty": "beginner"
}

RULES:
- Translate the ENTIRE message to natural, conversational Spanish
- Convert all English words to appropriate Spanish equivalents
- Keep any existing Spanish words as they are (unless they need grammar adjustments)
- Choose appropriate difficulty: "beginner", "intermediate", or "advanced"
- Maintain the same meaning, tone, and conversational style
- Focus on how a native Spanish speaker would naturally say it

EXAMPLE:
Input: "¡Hola! I'm doing great, gracias! How are you?"
Output: "¡Hola! Estoy muy bien, ¡gracias! ¿Cómo estás?"`,
      prompt: `Translate this AI response to complete Spanish: "${context.aiReply}"

Return a JSON object with the full Spanish translation and difficulty level.`,
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
  instructions: `You are a Spanish learning conversation partner. Your job is to help users learn Spanish gradually by responding to their messages using MOSTLY ENGLISH but strategically introducing Spanish words.

CRITICAL: Your responses should be PRIMARILY IN ENGLISH. Only use Spanish for:
1. Spanish words they already know (from their vocabulary list)
2. Exactly one new Spanish word to teach them

Everything else MUST be in English. This is a gradual learning approach.

ALWAYS use the generate-contextual-reply tool to create responses that:
- Respond naturally to what the user said IN ENGLISH
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
  instructions: `You provide complete, natural Spanish translations of AI responses. Your job is to take mixed English/Spanish AI replies and convert them to complete Spanish that learners can see as their goal. Always use the full-spanish-translation tool.`,
  model: openai("gpt-4o-mini"),
  tools: { fullTranslationTool },
});
