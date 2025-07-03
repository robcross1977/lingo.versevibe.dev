# 🌟 Lingo VerseVibe

**An AI-powered Spanish learning chat application built with Next.js, TypeScript, and Mastra AI framework.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

## 🚀 Features

- **🤖 AI-Powered Learning**: Intelligent Spanish tutor powered by Mastra AI framework
- **💬 Real-time Chat**: Interactive conversations with instant grammar corrections
- **🔄 Live Translation**: Get real-time translations for better understanding
- **📝 Grammar Correction**: Automatic correction of Spanish grammar and syntax
- **💾 Conversation History**: All conversations saved to database for progress tracking
- **🎨 Modern UI**: Beautiful, responsive interface built with shadcn/ui components
- **⚡ Real-time Streaming**: Experience smooth, character-by-character AI responses

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **AI/React** - Streaming chat interface

### Backend

- **Mastra AI Framework** - AI agent orchestration
- **Prisma ORM** - Database modeling and queries
- **PostgreSQL** - Production database (Vercel Postgres)

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL database (or Vercel Postgres)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lingo.versevibe.dev
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="your-postgresql-connection-string"
MASTRA_API_KEY="your-mastra-api-key"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
lingo.versevibe.dev/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   └── chat/          # Chat API endpoint
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page (chat interface)
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Utility functions
│   ├── mastra/               # Mastra AI configuration
│   │   ├── agents/           # AI agents
│   │   ├── tools/            # Custom tools
│   │   └── workflows/        # AI workflows
│   └── generated/            # Generated Prisma client
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── docs/                     # Project documentation
```

## 🤖 AI Agent Configuration

The Spanish learning agent is configured with:

- **Grammar correction** capabilities
- **Translation** between English and Spanish
- **Conversational** responses to encourage practice
- **Structured JSON output** format for consistent parsing

### Agent Features

- Detects and corrects Spanish grammar mistakes
- Provides English translations for Spanish text
- Offers contextual responses to continue conversations
- Maintains conversation flow while teaching

## 💾 Database Schema

### Conversation Model

```prisma
model Conversation {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}
```

### Message Model

```prisma
model Message {
  id             String       @id @default(cuid())
  role           String       // "user" or "assistant"
  content        String
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId String
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Flingo-versevibe)

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Mastra Agent Setup

The Spanish agent is configured in `src/mastra/agents/spanish-agent.ts` with:

- Custom system prompts for Spanish learning
- JSON response formatting
- Grammar correction algorithms
- Translation capabilities

### Database Configuration

Database settings are managed through Prisma in `prisma/schema.prisma`. The app supports:

- PostgreSQL (production)
- SQLite (development/testing)

## 📚 API Documentation

### Chat Endpoint

**POST** `/api/chat`

**Request Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hola, ¿cómo estas?"
    }
  ]
}
```

**Response:** Streaming JSON with:

```json
{
  "correction": "Hola, ¿cómo estás?",
  "translation": "Hello, how are you?",
  "reply": "¡Hola! Estoy muy bien, gracias. I noticed you missed the accent on 'estás'. How are you doing today?"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions under 15 lines when possible
- Maintain single responsibility principle

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mastra AI](https://mastra.ai) - AI framework powering the learning agent
- [shadcn/ui](https://ui.shadcn.com) - Beautiful component library
- [Vercel](https://vercel.com) - Hosting and database infrastructure
- [Prisma](https://prisma.io) - Database ORM and management

## 📞 Support

- 📧 Email: support@versevibe.dev
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/lingo-versevibe/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/lingo-versevibe/discussions)

---

Made with ❤️ by the VerseVibe Team
