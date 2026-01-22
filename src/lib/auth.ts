import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Log configuration status at startup
if (process.env.NODE_ENV === "production") {
  console.log("📋 NextAuth configuration status:", {
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasUrl: !!process.env.NEXTAUTH_URL,
    url: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  });
}

// Validate Google OAuth configuration
if (process.env.NODE_ENV === "production") {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ Google OAuth credentials are missing. Google sign-in will not work.");
  }
}

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  // Note: Even with JWT strategy, adapter is used for user management
  adapter: PrismaAdapter(prisma),

  // Use JWT for sessions (stateless, no database lookup needed)
  session: {
    strategy: "jwt",
  },

  // Configure authentication providers
  providers: [
    // Credentials Provider - Email/Password authentication
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Return user object (will be encoded in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    // Google OAuth Provider - only add if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  // Callbacks - customize JWT and session
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user ID to session (from JWT token)
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Log OAuth sign-in attempts for debugging
      if (account?.provider === "google") {
        console.log("🔐 Google OAuth sign-in attempt:", {
          userId: user.id,
          email: user.email,
          provider: account.provider,
        });
      }
      return true;
    },
  },

  // Error handling
  events: {
    async signIn({ user, account, isNewUser }) {
      if (account?.provider === "google") {
        console.log("✅ Google OAuth sign-in successful:", {
          userId: user.id,
          email: user.email,
          isNewUser,
        });
      }
    },
  },

  // Pages - customize auth pages (optional)
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Security settings
  secret: process.env.NEXTAUTH_SECRET,
};
