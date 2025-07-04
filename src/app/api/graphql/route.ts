import { createYoga, createSchema } from "graphql-yoga";
import { PrismaClient } from "@/generated/prisma";
import { auth } from "../../../../auth";
import type { Session } from "next-auth";

const prisma = new PrismaClient();

/**
 * GraphQL context type including authentication session
 */
type GraphQLContext = {
  session: Session | null;
};

/**
 * GraphQL schema definition for the language learning app
 * Includes types for User, Conversation and Message entities with authentication
 */
const schema = createSchema<GraphQLContext>({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String
      me: User
      conversations: [Conversation!]!
      conversation(id: ID!): Conversation
      messages(conversationId: ID!): [Message!]!
    }

    type User {
      id: ID!
      email: String
      name: String
      image: String
      createdAt: String!
      updatedAt: String!
      conversations: [Conversation!]!
    }

    type Conversation {
      id: ID!
      userId: ID!
      user: User!
      createdAt: String!
      messages: [Message!]!
    }

    type Message {
      id: ID!
      role: String!
      content: String!
      createdAt: String!
      conversationId: ID!
      conversation: Conversation!
    }

    type Mutation {
      createConversation: Conversation!
      addMessage(conversationId: ID!, role: String!, content: String!): Message!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "Hello from GraphQL!",

      /**
       * Get current authenticated user
       */
      me: async (_, __, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        // Find or create user in database
        let user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { conversations: true },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
            },
            include: { conversations: true },
          });
        }

        return user;
      },

      /**
       * Fetch all conversations for the authenticated user
       */
      conversations: async (_, __, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        return await prisma.conversation.findMany({
          where: { userId: session.user.id },
          include: {
            messages: true,
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },

      /**
       * Fetch a specific conversation by ID (only if it belongs to the user)
       */
      conversation: async (_, { id }, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        const conversation = await prisma.conversation.findUnique({
          where: { id },
          include: {
            messages: true,
            user: true,
          },
        });

        if (!conversation || conversation.userId !== session.user.id) {
          throw new Error("Conversation not found or access denied");
        }

        return conversation;
      },

      /**
       * Fetch all messages for a specific conversation (only if it belongs to the user)
       */
      messages: async (_, { conversationId }, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        // First verify the conversation belongs to the user
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation || conversation.userId !== session.user.id) {
          throw new Error("Conversation not found or access denied");
        }

        return await prisma.message.findMany({
          where: { conversationId },
          include: {
            conversation: {
              include: { user: true },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      },
    },

    Mutation: {
      /**
       * Create a new conversation for the authenticated user
       */
      createConversation: async (_, __, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        // Ensure user exists in database
        await prisma.user.upsert({
          where: { id: session.user.id },
          update: {},
          create: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        });

        return await prisma.conversation.create({
          data: {
            userId: session.user.id,
          },
          include: {
            messages: true,
            user: true,
          },
        });
      },

      /**
       * Add a new message to an existing conversation (only if it belongs to the user)
       */
      addMessage: async (_, { conversationId, role, content }, { session }) => {
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        // First verify the conversation belongs to the user
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation || conversation.userId !== session.user.id) {
          throw new Error("Conversation not found or access denied");
        }

        return await prisma.message.create({
          data: {
            conversationId,
            role,
            content,
          },
          include: {
            conversation: {
              include: { user: true },
            },
          },
        });
      },
    },

    // Field resolvers for nested data
    User: {
      conversations: async (parent) => {
        return await prisma.conversation.findMany({
          where: { userId: parent.id },
          include: { messages: true },
          orderBy: { createdAt: "desc" },
        });
      },
    },

    Conversation: {
      user: async (parent) => {
        return await prisma.user.findUnique({
          where: { id: parent.userId },
        });
      },
      messages: async (parent) => {
        return await prisma.message.findMany({
          where: { conversationId: parent.id },
          orderBy: { createdAt: "asc" },
        });
      },
    },

    Message: {
      conversation: async (parent) => {
        return await prisma.conversation.findUnique({
          where: { id: parent.conversationId },
          include: { user: true },
        });
      },
    },
  },
});

/**
 * Create GraphQL context with authentication session
 */
const createContext = async () => {
  const session = await auth();
  return { session };
};

const { handleRequest } = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

export async function GET(request: Request) {
  return handleRequest(request, {});
}

export async function POST(request: Request) {
  return handleRequest(request, {});
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, {});
}
