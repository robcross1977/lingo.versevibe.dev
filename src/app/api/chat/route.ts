import { mastra } from "@/mastra";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const agent = mastra.getAgent("spanishAgent");
    const result = await agent.stream(messages);

    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
