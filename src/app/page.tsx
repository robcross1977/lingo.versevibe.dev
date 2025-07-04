"use client";

import { useChat } from "ai/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIResponse } from "@/components/ui/ai-response";

// Helper to parse the new workflow API response
const parseWorkflowResponse = (content: string) => {
  try {
    const parsed = JSON.parse(content);

    // Check if this is the new workflow response format
    if (parsed.success && parsed.data) {
      return {
        isWorkflowResponse: true,
        data: parsed.data,
      };
    }

    // Fallback for old format or plain text
    return {
      isWorkflowResponse: false,
      fallback: {
        correction: "",
        translation: "",
        reply: content,
        wordTranslations: [],
      },
    };
  } catch {
    // If parsing fails, return the raw content as the reply
    return {
      isWorkflowResponse: false,
      fallback: {
        correction: "",
        translation: "",
        reply: content,
        wordTranslations: [],
      },
    };
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
          success: true,
          data: {
            userMessage: "Welcome!",
            englishTranslations: {
              translations: [],
            },
            corrections: {
              hasErrors: false,
              correctedText: "",
              corrections: [],
            },
            contextualReply: {
              reply:
                "¡Hola! Welcome to Lingo VerseVibe! I'm here to help you practice Spanish. Feel free to write in Spanish, English, or mix both - I'll help you learn! ¿Cómo estás hoy? (How are you today?)",
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
                {
                  word: "Cómo",
                  translation: "How",
                  position: 130,
                  isKnown: false,
                },
                {
                  word: "estás",
                  translation: "are you",
                  position: 135,
                  isKnown: false,
                },
                {
                  word: "hoy",
                  translation: "today",
                  position: 141,
                  isKnown: false,
                },
              ],
            },
            fullTranslation: {
              fullSpanishSentence:
                "¡Hola! ¡Bienvenido a Lingo VerseVibe! Estoy aquí para ayudarte a practicar español. Siéntete libre de escribir en español, inglés, o mezclar ambos - ¡te ayudaré a aprender! ¿Cómo estás hoy?",
              difficulty: "beginner",
            },
          },
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
              const response =
                m.role === "assistant"
                  ? parseWorkflowResponse(m.content)
                  : null;

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
                    className={`max-w-lg ${
                      m.role === "user" ? "w-full" : "w-full"
                    }`}
                  >
                    {m.role === "assistant" && response ? (
                      response.isWorkflowResponse ? (
                        <AIResponse data={response.data} />
                      ) : (
                        // Fallback for old format
                        <div className="rounded-lg p-3 bg-muted">
                          <p>{response.fallback?.reply || m.content}</p>
                        </div>
                      )
                    ) : (
                      <div
                        className={`rounded-lg p-3 ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto max-w-xs"
                            : "bg-muted"
                        }`}
                      >
                        <p>{m.content}</p>
                      </div>
                    )}
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
