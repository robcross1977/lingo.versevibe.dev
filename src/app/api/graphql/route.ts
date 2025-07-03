import { createYoga, createSchema } from "graphql-yoga";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * GraphQL schema definition for the language learning app
 * Includes types for Conversation and Message entities
 */
const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String
      conversations: [Conversation!]!
      conversation(id: ID!): Conversation
      messages(conversationId: ID!): [Message!]!
    }

    type Conversation {
      id: ID!
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
       * Fetch all conversations with their messages
       */
      conversations: async () => {
        return await prisma.conversation.findMany({
          include: {
            messages: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },

      /**
       * Fetch a specific conversation by ID
       */
      conversation: async (_, { id }) => {
        return await prisma.conversation.findUnique({
          where: { id },
          include: {
            messages: true,
          },
        });
      },

      /**
       * Fetch all messages for a specific conversation
       */
      messages: async (_, { conversationId }) => {
        return await prisma.message.findMany({
          where: { conversationId },
          include: {
            conversation: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      },
    },

    Mutation: {
      /**
       * Create a new conversation
       */
      createConversation: async () => {
        return await prisma.conversation.create({
          data: {},
          include: {
            messages: true,
          },
        });
      },

      /**
       * Add a new message to an existing conversation
       */
      addMessage: async (_, { conversationId, role, content }) => {
        return await prisma.message.create({
          data: {
            conversationId,
            role,
            content,
          },
          include: {
            conversation: true,
          },
        });
      },
    },

    // Field resolvers for nested data
    Conversation: {
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
        });
      },
    },
  },
});

const { handleRequest } = createYoga({
  schema,
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
