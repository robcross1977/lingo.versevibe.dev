-- CreateEnum
CREATE TYPE "VocabularyStatus" AS ENUM ('STRUGGLING', 'LEARNING', 'MASTERED');

-- CreateEnum
CREATE TYPE "VocabularyDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "user_vocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "status" "VocabularyStatus" NOT NULL DEFAULT 'LEARNING',
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" "VocabularyDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "contexts" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_vocabulary_userId_idx" ON "user_vocabulary"("userId");

-- CreateIndex
CREATE INDEX "user_vocabulary_status_idx" ON "user_vocabulary"("status");

-- CreateIndex
CREATE INDEX "user_vocabulary_last_used_idx" ON "user_vocabulary"("last_used");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_userId_word_key" ON "user_vocabulary"("userId", "word");

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
