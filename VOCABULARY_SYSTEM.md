# RAG-Based Vocabulary Learning System

## Overview

The Spanish learning application now includes a **RAG (Retrieval-Augmented Generation)** based vocabulary tracking system designed to handle long-term learning progression over weeks and months.

## Why RAG for Vocabulary?

Traditional memory approaches (like "last 10 messages") don't scale for language learning because:

- Users may learn **thousands of words** over time
- Need to track **success/failure patterns** for each word
- Must identify words user **struggles with** for repetition
- Context matters: same word in different situations

## Architecture

### 1. Vocabulary Knowledge Base

```typescript
VocabularyEntry {
  word: string;           // Spanish word
  translation: string;    // English meaning
  status: "struggling" | "learning" | "mastered";
  successCount: number;   // Times used correctly
  errorCount: number;     // Times used incorrectly
  lastUsed: string;      // ISO timestamp
  difficulty: "beginner" | "intermediate" | "advanced";
  contexts: string[];    // Where word was used
}
```

### 2. Smart Word Selection

The system uses **semantic search** to:

- **Prioritize struggling words** (high error count)
- **Find contextually relevant** new words
- **Reinforce forgotten words** (not used recently)
- **Gradually increase difficulty**

### 3. Learning Progression

```
New Word → Learning → Struggling → Learning → Mastered
     ↓         ↓          ↓           ↓         ↓
  Introduce  Practice   Repeat    Reinforce  Maintain
```

## Implementation Status

### ✅ Completed

- **Prisma + PostgreSQL vocabulary database** with type-safe operations
- **Smart vocabulary selection** based on user performance data
- **Vocabulary tracking tools** (`vocabularyRAGTool`, `smartVocabularySelector`)
- **Multi-device support** via PostgreSQL cloud database
- **Automatic migrations** with Prisma schema management
- **Real-time vocabulary progress tracking**
- **Intelligent word status progression** (LEARNING → STRUGGLING → MASTERED)
- **Type-safe database operations** with Prisma Client
- **Integrated with existing User model** for proper relationships

### 🏗️ Prisma Schema

```prisma
model UserVocabulary {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  word         String
  translation  String
  status       VocabularyStatus @default(LEARNING)
  successCount Int      @default(0) @map("success_count")
  errorCount   Int      @default(0) @map("error_count")
  lastUsed     DateTime @default(now()) @map("last_used")
  difficulty   VocabularyDifficulty @default(BEGINNER)
  contexts     String[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([userId, word])
  @@index([userId])
  @@index([status])
  @@index([lastUsed])
  @@map("user_vocabulary")
}

enum VocabularyStatus {
  STRUGGLING
  LEARNING
  MASTERED
}

enum VocabularyDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

### 🔄 Smart Status Progression

- **New word** → `LEARNING` (first encounter)
- **Success** → `LEARNING` → `MASTERED` (5+ uses, 80%+ success rate)
- **Errors** → `STRUGGLING` (success rate < 40% with 5+ uses, or < 30% with 3+ uses)
- **Recovery** → `STRUGGLING` → `LEARNING` → `MASTERED`

## Usage Examples

### Adding New Vocabulary

```typescript
await vocabularyRAGTool.execute({
  context: {
    action: "add",
    userId: "user123",
    word: "casa",
    translation: "house",
    context: "describing home",
  },
});
```

### Updating Progress

```typescript
await vocabularyRAGTool.execute({
  context: {
    action: "update",
    userId: "user123",
    word: "comer",
    wasSuccessful: false,
    context: "food conversation",
  },
});
```

### Smart Word Selection

```typescript
const selection = await smartVocabularySelector.execute({
  context: {
    userId: "user123",
    currentContext: "talking about daily routine",
    knownWords: ["casa", "comer", "agua"],
    maxNewWords: 1,
  },
});
// Returns: prioritized words based on user's learning needs
```

## Benefits

1. **Scalable**: Handles thousands of words efficiently
2. **Personalized**: Adapts to each user's learning patterns
3. **Contextual**: Uses semantic search for relevant vocabulary
4. **Progressive**: Gradually increases difficulty
5. **Repetition-based**: Reinforces struggling words
6. **Long-term**: Tracks progress over months/years

## Integration with Current System

The vocabulary system integrates seamlessly with the existing multi-agent workflow:

1. **English Translation Agent** → Identifies new words to add
2. **Spanish Correction Agent** → Updates word success/failure status
3. **Contextual Reply Agent** → Uses smart word selection for responses
4. **Full Translation Agent** → Provides difficulty-appropriate translations

This creates a comprehensive learning loop that adapts to each user's progress over time.
