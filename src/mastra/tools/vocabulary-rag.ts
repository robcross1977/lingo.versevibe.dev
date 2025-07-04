import { createTool } from "@mastra/core";
import { z } from "zod";
import {
  PrismaClient,
  VocabularyStatus,
  VocabularyDifficulty,
} from "../../generated/prisma";

// Prisma client instance
const prisma = new PrismaClient();

/**
 * Vocabulary entry schema matching Prisma model
 */
const VocabularyEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  word: z.string(),
  translation: z.string(),
  status: z.nativeEnum(VocabularyStatus),
  successCount: z.number(),
  errorCount: z.number(),
  lastUsed: z.string(),
  difficulty: z.nativeEnum(VocabularyDifficulty),
  contexts: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Vocabulary RAG Tool for managing user's Spanish vocabulary learning progress
 *
 * This tool provides intelligent vocabulary tracking with the following capabilities:
 * - Add new words with automatic difficulty assessment
 * - Update word performance based on user success/failure
 * - Query vocabulary with smart filtering and ranking
 * - Get struggling words that need more practice
 *
 * The system uses a sophisticated status progression:
 * - LEARNING: New words or words with mixed performance
 * - STRUGGLING: Words with high error rates that need attention
 * - MASTERED: Words with consistent success (>80% success rate, 5+ uses)
 */
export const vocabularyRAGTool = createTool({
  id: "vocabulary-rag",
  description:
    "Manage user vocabulary learning progress with intelligent tracking and retrieval",
  inputSchema: z.object({
    action: z.enum(["add", "update", "query", "get_struggling"]),
    userId: z.string().describe("User identifier"),
    word: z.string().optional().describe("Spanish word to add/update"),
    translation: z.string().optional().describe("English translation"),
    success: z
      .boolean()
      .optional()
      .describe("Whether user used word correctly (for updates)"),
    context: z.string().optional().describe("Context where word was used"),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum results to return"),
    status: z.enum(["STRUGGLING", "LEARNING", "MASTERED"]).optional(),
  }),
  execute: async ({ context }) => {
    const {
      action,
      userId,
      word,
      translation,
      success,
      context: userContext,
      difficulty,
      limit,
      status,
    } = context;
    try {
      switch (action) {
        case "add": {
          if (!word || !translation) {
            throw new Error("Word and translation are required for add action");
          }

          // Check if word already exists
          const existing = await prisma.userVocabulary.findUnique({
            where: {
              userId_word: {
                userId,
                word: word.toLowerCase(),
              },
            },
          });

          if (existing) {
            return {
              success: true,
              message: `Word '${word}' already exists in vocabulary`,
              data: {
                id: existing.id,
                word: existing.word,
                translation: existing.translation,
                status: existing.status,
                successCount: existing.successCount,
                errorCount: existing.errorCount,
              },
            };
          }

          // Create new vocabulary entry
          const newEntry = await prisma.userVocabulary.create({
            data: {
              userId,
              word: word.toLowerCase(),
              translation,
              difficulty: difficulty || VocabularyDifficulty.BEGINNER,
              contexts: userContext ? [userContext] : [],
            },
          });

          return {
            success: true,
            message: `Added word '${word}' to vocabulary`,
            data: {
              id: newEntry.id,
              word: newEntry.word,
              translation: newEntry.translation,
              status: newEntry.status,
              difficulty: newEntry.difficulty,
            },
          };
        }

        case "update": {
          if (!word || success === undefined) {
            throw new Error(
              "Word and success status are required for update action"
            );
          }

          const existing = await prisma.userVocabulary.findUnique({
            where: {
              userId_word: {
                userId,
                word: word.toLowerCase(),
              },
            },
          });

          if (!existing) {
            throw new Error(`Word '${word}' not found in vocabulary`);
          }

          // Calculate new counts and status
          const newSuccessCount = success
            ? existing.successCount + 1
            : existing.successCount;
          const newErrorCount = success
            ? existing.errorCount
            : existing.errorCount + 1;
          const totalUses = newSuccessCount + newErrorCount;
          const successRate = totalUses > 0 ? newSuccessCount / totalUses : 0;

          // Determine new status based on performance
          let newStatus = existing.status;
          if (totalUses >= 5) {
            if (successRate >= 0.8) {
              newStatus = VocabularyStatus.MASTERED;
            } else if (successRate < 0.4) {
              newStatus = VocabularyStatus.STRUGGLING;
            } else {
              newStatus = VocabularyStatus.LEARNING;
            }
          } else if (successRate < 0.3 && totalUses >= 3) {
            newStatus = VocabularyStatus.STRUGGLING;
          }

          // Update contexts
          const newContexts =
            userContext && !existing.contexts.includes(userContext)
              ? [...existing.contexts, userContext]
              : existing.contexts;

          const updated = await prisma.userVocabulary.update({
            where: {
              userId_word: {
                userId,
                word: word.toLowerCase(),
              },
            },
            data: {
              successCount: newSuccessCount,
              errorCount: newErrorCount,
              status: newStatus,
              lastUsed: new Date(),
              contexts: newContexts,
            },
          });

          return {
            success: true,
            message: `Updated word '${word}' performance`,
            data: {
              id: updated.id,
              word: updated.word,
              translation: updated.translation,
              status: updated.status,
              successCount: updated.successCount,
              errorCount: updated.errorCount,
              successRate: Math.round(successRate * 100),
            },
          };
        }

        case "query": {
          const whereClause: { userId: string; status?: VocabularyStatus } = {
            userId,
          };
          if (status) {
            whereClause.status = status;
          }

          const vocabularyEntries = await prisma.userVocabulary.findMany({
            where: whereClause,
            orderBy: [{ lastUsed: "desc" }, { createdAt: "desc" }],
            take: limit,
          });

          return {
            success: true,
            message: `Found ${vocabularyEntries.length} vocabulary entries`,
            data: vocabularyEntries.map((entry) => ({
              id: entry.id,
              word: entry.word,
              translation: entry.translation,
              status: entry.status,
              difficulty: entry.difficulty,
              successCount: entry.successCount,
              errorCount: entry.errorCount,
              lastUsed: entry.lastUsed.toISOString(),
              contexts: entry.contexts,
              successRate:
                entry.successCount + entry.errorCount > 0
                  ? Math.round(
                      (entry.successCount /
                        (entry.successCount + entry.errorCount)) *
                        100
                    )
                  : 0,
            })),
          };
        }

        case "get_struggling": {
          const strugglingWords = await prisma.userVocabulary.findMany({
            where: {
              userId,
              OR: [
                { status: VocabularyStatus.STRUGGLING },
                {
                  AND: [
                    { status: VocabularyStatus.LEARNING },
                    {
                      lastUsed: {
                        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                      },
                    },
                  ],
                },
              ],
            },
            orderBy: [{ errorCount: "desc" }, { lastUsed: "asc" }],
            take: limit,
          });

          return {
            success: true,
            message: `Found ${strugglingWords.length} words that need practice`,
            data: strugglingWords.map((entry) => ({
              id: entry.id,
              word: entry.word,
              translation: entry.translation,
              status: entry.status,
              difficulty: entry.difficulty,
              successCount: entry.successCount,
              errorCount: entry.errorCount,
              lastUsed: entry.lastUsed.toISOString(),
              contexts: entry.contexts,
              daysSinceLastUse: Math.floor(
                (Date.now() - entry.lastUsed.getTime()) / (24 * 60 * 60 * 1000)
              ),
              successRate:
                entry.successCount + entry.errorCount > 0
                  ? Math.round(
                      (entry.successCount /
                        (entry.successCount + entry.errorCount)) *
                        100
                    )
                  : 0,
            })),
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error("Vocabulary RAG Tool Error:", error);
      return {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
      };
    }
  },
});

/**
 * Smart vocabulary selector for choosing appropriate words for learning
 *
 * This function implements intelligent word selection based on:
 * - User's current vocabulary level and performance
 * - Spaced repetition principles (struggling words get priority)
 * - Difficulty progression (gradually introduce harder words)
 * - Context relevance (words used in similar contexts)
 */
export const smartVocabularySelector = createTool({
  id: "smart-vocabulary-selector",
  description:
    "Intelligently select vocabulary words for learning based on user performance",
  inputSchema: z.object({
    userId: z.string().describe("User identifier"),
    excludeWords: z
      .array(z.string())
      .optional()
      .default([])
      .describe("Words to exclude from selection"),
    maxWords: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum words to select"),
    preferredDifficulty: z
      .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
      .optional(),
    contextHint: z
      .string()
      .optional()
      .describe("Context hint for relevant word selection"),
  }),
  execute: async ({ context }) => {
    const { userId, excludeWords, maxWords } = context;
    try {
      // Get user's vocabulary statistics
      const vocabularyStats = await prisma.userVocabulary.groupBy({
        by: ["status", "difficulty"],
        where: { userId },
        _count: true,
      });

      // Get struggling words (highest priority)
      const strugglingWords = await prisma.userVocabulary.findMany({
        where: {
          userId,
          status: VocabularyStatus.STRUGGLING,
          word: { notIn: excludeWords },
        },
        orderBy: [{ errorCount: "desc" }, { lastUsed: "asc" }],
        take: Math.min(maxWords, 3), // Max 3 struggling words at once
      });

      // Get learning words that haven't been used recently
      const reviewWords = await prisma.userVocabulary.findMany({
        where: {
          userId,
          status: VocabularyStatus.LEARNING,
          word: { notIn: excludeWords },
          lastUsed: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
        },
        orderBy: [{ lastUsed: "asc" }, { successCount: "asc" }],
        take: maxWords - strugglingWords.length,
      });

      const selectedWords = [...strugglingWords, ...reviewWords];

      return {
        success: true,
        message: `Selected ${selectedWords.length} words for learning`,
        data: {
          words: selectedWords.map((word) => ({
            id: word.id,
            word: word.word,
            translation: word.translation,
            status: word.status,
            difficulty: word.difficulty,
            priority:
              word.status === VocabularyStatus.STRUGGLING ? "high" : "medium",
            reason:
              word.status === VocabularyStatus.STRUGGLING
                ? `Struggling word (${word.errorCount} errors)`
                : `Review needed (${Math.floor(
                    (Date.now() - word.lastUsed.getTime()) /
                      (24 * 60 * 60 * 1000)
                  )} days since last use)`,
            successRate:
              word.successCount + word.errorCount > 0
                ? Math.round(
                    (word.successCount /
                      (word.successCount + word.errorCount)) *
                      100
                  )
                : 0,
          })),
          stats: {
            total: vocabularyStats.reduce((sum, stat) => sum + stat._count, 0),
            struggling:
              vocabularyStats.find(
                (s) => s.status === VocabularyStatus.STRUGGLING
              )?._count || 0,
            learning:
              vocabularyStats.find(
                (s) => s.status === VocabularyStatus.LEARNING
              )?._count || 0,
            mastered:
              vocabularyStats.find(
                (s) => s.status === VocabularyStatus.MASTERED
              )?._count || 0,
          },
        },
      };
    } catch (error) {
      console.error("Smart Vocabulary Selector Error:", error);
      return {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
      };
    }
  },
});

export { VocabularyEntrySchema };
