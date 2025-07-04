import { mastra } from "@/mastra";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Get current session for user ID
    const session = await auth();
    const userId = session?.user?.id || "anonymous";

    // Get the Spanish learning workflow from Mastra
    const workflow = mastra.getWorkflow("spanishLearningWorkflow");

    if (!workflow) {
      throw new Error("Spanish learning workflow not found");
    }

    // Query user's known Spanish words from the database
    let knownSpanishWords: string[] = [];

    if (userId !== "anonymous") {
      try {
        const userVocabulary = await prisma.userVocabulary.findMany({
          where: {
            userId,
            status: {
              in: ["LEARNING", "MASTERED"], // Include words that are learned or mastered
            },
          },
          select: {
            word: true,
          },
        });

        knownSpanishWords = userVocabulary.map((v) => v.word);
        console.log(
          `Found ${knownSpanishWords.length} known Spanish words for user ${userId}`
        );
      } catch (error) {
        console.warn("Could not fetch user vocabulary:", error);
        // Continue with empty array if database query fails
      }
    }

    // Create a workflow run
    const run = await workflow.createRunAsync();

    // Execute the workflow with the user's message and known vocabulary
    const result = await run.start({
      inputData: {
        userMessage,
        knownSpanishWords,
      },
    });

    // Check if workflow was successful
    if (result.status === "success") {
      // Update vocabulary after successful interaction
      if (userId !== "anonymous" && result.result?.contextualReply) {
        try {
          // Ensure user exists in the database before creating vocabulary entries
          if (session?.user) {
            await prisma.user.upsert({
              where: { id: userId },
              update: {}, // Don't update anything if user exists
              create: {
                id: userId,
                email: session.user.email,
                name: session.user.name,
                image: session.user.image,
              },
            });
          }

          const { contextualReply } = result.result;

          // Add the new Spanish word to vocabulary if it exists
          if (contextualReply.newSpanishWord) {
            const { word, translation } = contextualReply.newSpanishWord;

            await prisma.userVocabulary.upsert({
              where: {
                userId_word: {
                  userId,
                  word: word.toLowerCase(),
                },
              },
              update: {
                lastUsed: new Date(),
                contexts: {
                  push: userMessage.substring(0, 100), // Add context (truncated)
                },
              },
              create: {
                userId,
                word: word.toLowerCase(),
                translation,
                difficulty: "BEGINNER",
                contexts: [userMessage.substring(0, 100)],
              },
            });

            console.log(`Added/updated vocabulary word: ${word}`);
          }

          // Update performance for any Spanish words the user used correctly
          if (contextualReply.spanishWords) {
            for (const spanishWord of contextualReply.spanishWords) {
              if (spanishWord.isKnown) {
                // User successfully used a known word - mark as success
                await prisma.userVocabulary.upsert({
                  where: {
                    userId_word: {
                      userId,
                      word: spanishWord.word.toLowerCase(),
                    },
                  },
                  update: {
                    successCount: {
                      increment: 1,
                    },
                    lastUsed: new Date(),
                  },
                  create: {
                    userId,
                    word: spanishWord.word.toLowerCase(),
                    translation: spanishWord.translation,
                    difficulty: "BEGINNER",
                    successCount: 1,
                    contexts: [userMessage.substring(0, 100)],
                  },
                });
              }
            }
          }
        } catch (vocabularyError) {
          console.warn("Could not update vocabulary:", vocabularyError);
          // Don't fail the whole request if vocabulary update fails
        }
      }

      // Return the successful result as JSON
      return NextResponse.json({
        success: true,
        data: result.result,
      });
    } else if (result.status === "failed") {
      throw new Error(`Workflow failed: ${result.error.message}`);
    } else {
      throw new Error("Workflow was suspended or in unknown state");
    }
  } catch (error) {
    console.error("Chat API error:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
