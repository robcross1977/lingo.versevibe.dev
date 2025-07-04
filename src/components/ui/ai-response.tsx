import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartText } from "./smart-text";

interface EnglishTranslation {
  englishWord: string;
  spanishTranslation: string;
  confidence: number;
}

interface Correction {
  original: string;
  corrected: string;
  errorType: string;
  explanation: string;
}

interface SpanishWord {
  word: string;
  translation: string;
  position: number;
  isKnown: boolean;
}

interface NewSpanishWord {
  word: string;
  translation: string;
  position: number;
}

interface AIResponseData {
  userMessage: string;
  englishTranslations: {
    translations: EnglishTranslation[];
  };
  corrections: {
    hasErrors: boolean;
    correctedText: string;
    corrections: Correction[];
  };
  contextualReply: {
    reply: string;
    newSpanishWord: NewSpanishWord;
    spanishWords: SpanishWord[];
  };
  fullTranslation: {
    fullSpanishSentence: string;
    difficulty: string;
  };
}

interface AIResponseProps {
  data: AIResponseData;
}

/**
 * Component for displaying comprehensive Spanish learning feedback
 */
export function AIResponse({ data }: AIResponseProps) {
  const { englishTranslations, corrections, contextualReply, fullTranslation } =
    data;

  return (
    <div className="space-y-4">
      {/* English to Spanish Translations */}
      {englishTranslations.translations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-sm font-medium">
              📖 English → Spanish Translations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {englishTranslations.translations.map((translation, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">
                    {translation.englishWord}
                  </span>
                  <span className="text-blue-700 font-medium">
                    {translation.spanishTranslation}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(translation.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spanish Corrections */}
      {corrections.hasErrors && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 text-sm font-medium">
              ✏️ Spanish Corrections
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-gray-600 mb-1">Corrected:</div>
                <div className="text-amber-800 font-medium">
                  {corrections.correctedText}
                </div>
              </div>
              {corrections.corrections.map((correction, index) => (
                <div key={index} className="border-l-2 border-amber-300 pl-3">
                  <div className="text-xs text-gray-600">
                    <span className="line-through text-red-600">
                      {correction.original}
                    </span>
                    {" → "}
                    <span className="text-green-600 font-medium">
                      {correction.corrected}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {correction.errorType}: {correction.explanation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Reply with Interactive Spanish Words */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 text-sm font-medium">
            💬 Reply
            {contextualReply.newSpanishWord && (
              <span className="ml-2 text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                New word: {contextualReply.newSpanishWord.word} (
                {contextualReply.newSpanishWord.translation})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SmartText
            text={contextualReply.reply}
            wordTranslations={contextualReply.spanishWords}
          />
        </CardContent>
      </Card>

      {/* Full Spanish Translation */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-800 text-sm font-medium">
            🎯 Complete Spanish Translation
            <span className="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded capitalize">
              {fullTranslation.difficulty}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-purple-800 font-medium">
            {fullTranslation.fullSpanishSentence}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
