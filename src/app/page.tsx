"use client";

import { useChat } from "ai/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper to parse the AI's JSON response
const parseAIResponse = (content: string) => {
  // Only try to parse if it looks like complete JSON (starts with { and ends with })
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    // If it's not complete JSON, return the raw content as reply
    return { correction: "", translation: "", reply: content };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      correction: parsed.correction || "",
      translation: parsed.translation || "",
      reply: parsed.reply || content, // Fallback to raw content
    };
  } catch {
    // If parsing fails, return the raw content as the reply
    return { correction: "", translation: "", reply: content };
  }
};

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    streamProtocol: "text",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: JSON.stringify({
          correction: "",
          translation: "",
          reply:
            "¡Hola! Welcome to Lingo VerseVibe! I'm here to help you practice Spanish. Feel free to write in Spanish, English, or mix both - I'll help you learn! ¿Cómo estás hoy? (How are you today?)",
        }),
      },
    ],
  });

  return (
    <div className="container mx-auto p-4 flex-grow flex flex-col">
      <div className="flex-grow flex flex-col bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Chat</h2>
          <Select defaultValue="spanish">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spanish">Spanish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {messages.map((m) => {
              const aiResponse =
                m.role === "assistant" ? parseAIResponse(m.content) : null;
              const displayContent = aiResponse ? aiResponse.reply : m.content;

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${
                    m.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                      AI
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-xs ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{displayContent}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary flex-shrink-0">
                      U
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border bg-background">
          <form className="relative" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              className="w-full bg-muted rounded-full p-4 pr-16 border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
