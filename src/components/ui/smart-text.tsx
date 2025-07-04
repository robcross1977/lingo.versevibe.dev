import React, { useState } from "react";

interface WordTranslation {
  word: string;
  translation: string;
  position: number;
  isKnown?: boolean; // Optional property to indicate if user knows this word
}

interface SmartTextProps {
  text: string;
  wordTranslations: WordTranslation[];
  className?: string;
}

/**
 * Component that makes words clickable based on AI-provided translations
 */
export function SmartText({
  text,
  wordTranslations,
  className = "",
}: SmartTextProps) {
  const [hoveredWord, setHoveredWord] = useState<{
    word: string;
    translation: string;
    x: number;
    y: number;
    isKnown?: boolean;
  } | null>(null);

  // Create a map of word positions to translations for quick lookup
  const translationMap = new Map<number, WordTranslation>();
  wordTranslations.forEach((wt) => {
    translationMap.set(wt.position, wt);
  });

  // Split text into characters to handle positioning accurately
  const chars = text.split("");
  const elements: React.ReactNode[] = [];
  let currentWord = "";
  let wordStartPos = 0;

  const handleWordHover = (
    word: string,
    translation: string,
    isKnown: boolean = false,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setHoveredWord({
      word,
      translation,
      isKnown,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleWordLeave = () => {
    setHoveredWord(null);
  };

  // Process each character to build words and check for translations
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // Check if this is a word character (letter or accented character)
    if (/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(char)) {
      if (currentWord === "") {
        wordStartPos = i; // Start of new word
      }
      currentWord += char;
    } else {
      // End of word, check if we have a translation for it
      if (currentWord) {
        const translation = translationMap.get(wordStartPos);
        if (translation) {
          // This word has a translation, make it interactive
          const colorClass = translation.isKnown
            ? "text-green-600 hover:text-green-800"
            : "text-blue-600 hover:text-blue-800";

          elements.push(
            <span
              key={`word-${wordStartPos}`}
              className={`cursor-pointer ${colorClass} hover:underline transition-colors`}
              onMouseEnter={(e) =>
                handleWordHover(
                  translation.word,
                  translation.translation,
                  translation.isKnown,
                  e
                )
              }
              onMouseLeave={handleWordLeave}
            >
              {currentWord}
            </span>
          );
        } else {
          // No translation, just regular text
          elements.push(
            <span key={`word-${wordStartPos}`}>{currentWord}</span>
          );
        }
        currentWord = "";
      }

      // Add the non-word character (space, punctuation, etc.)
      elements.push(<span key={`char-${i}`}>{char}</span>);
    }
  }

  // Handle case where text ends with a word
  if (currentWord) {
    const translation = translationMap.get(wordStartPos);
    if (translation) {
      const colorClass = translation.isKnown
        ? "text-green-600 hover:text-green-800"
        : "text-blue-600 hover:text-blue-800";

      elements.push(
        <span
          key={`word-${wordStartPos}`}
          className={`cursor-pointer ${colorClass} hover:underline transition-colors`}
          onMouseEnter={(e) =>
            handleWordHover(
              translation.word,
              translation.translation,
              translation.isKnown,
              e
            )
          }
          onMouseLeave={handleWordLeave}
        >
          {currentWord}
        </span>
      );
    } else {
      elements.push(<span key={`word-${wordStartPos}`}>{currentWord}</span>);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <span>{elements}</span>

      {/* Tooltip */}
      {hoveredWord && (
        <div
          className={`fixed z-50 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full ${
            hoveredWord.isKnown ? "bg-green-700" : "bg-gray-900"
          }`}
          style={{
            left: hoveredWord.x,
            top: hoveredWord.y,
          }}
        >
          {hoveredWord.word} = {hoveredWord.translation}
          {hoveredWord.isKnown && (
            <span className="ml-1 text-green-200">✓</span>
          )}
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              hoveredWord.isKnown ? "border-t-green-700" : "border-t-gray-900"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
}
