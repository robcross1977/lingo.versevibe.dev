import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import {
  englishTranslationAgent,
  spanishCorrectionAgent,
  fullTranslationAgent,
  contextualReplyTool,
} from "./agents/spanish-agent";
import { spanishLearningWorkflow } from "./workflows/spanish-learning-workflow";
import {
  vocabularyRAGTool,
  smartVocabularySelector,
} from "./tools/vocabulary-rag";

// Create contextual reply agent without memory for now (to fix the 500 error)
const contextualReplyAgentWithMemory = new Agent({
  name: "Contextual Reply Agent",
  instructions: `You are a Spanish learning conversation partner. Your job is to help users learn Spanish gradually.

ALWAYS use the generate-contextual-reply tool to create responses that:
- Respond naturally to what the user said
- Use Spanish words they've successfully used before (passed in the known words list)
- Use English for everything else, EXCEPT introduce exactly one NEW Spanish word they haven't used yet
- Make the conversation encouraging and supportive
- Keep track of vocabulary progress

You must ALWAYS call the generate-contextual-reply tool - never respond directly.`,
  model: openai("gpt-4o-mini"),
  tools: { contextualReplyTool },
  // Temporarily removing memory to fix the 500 error
});

/**
 * Initialize Mastra with Spanish learning agents, workflow, and memory
 */
export const mastra = new Mastra({
  agents: {
    englishTranslationAgent,
    spanishCorrectionAgent,
    contextualReplyAgent: contextualReplyAgentWithMemory,
    fullTranslationAgent,
  },
  workflows: {
    spanishLearningWorkflow,
  },
  logger: createLogger({
    name: "Lingo VerseVibe",
    level: "info",
  }),
});

// Export vocabulary tools for direct use
export { vocabularyRAGTool, smartVocabularySelector };
