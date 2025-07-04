import { mastra } from "@/mastra";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Get the Spanish learning workflow from Mastra
    const workflow = mastra.getWorkflow("spanishLearningWorkflow");

    if (!workflow) {
      throw new Error("Spanish learning workflow not found");
    }

    // Create a workflow run
    const run = await workflow.createRunAsync();

    // For now, use empty known words array - we'll add memory back later
    const knownSpanishWords: string[] = [];

    // Execute the workflow with the user's message
    const result = await run.start({
      inputData: {
        userMessage,
        knownSpanishWords,
      },
    });

    // Check if workflow was successful
    if (result.status === "success") {
      return Response.json({
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
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
