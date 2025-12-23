import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Validate required environment variables (log warnings instead of throwing to prevent app crash)
if (!process.env.NEXTAUTH_SECRET) {
  console.error(
    "⚠️ NEXTAUTH_SECRET is not set. Authentication will not work properly."
  );
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️ NEXTAUTH_URL is not set in production. This may cause authentication issues."
  );
}

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
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

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
  },

  // Pages - customize auth pages (optional)
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Security settings
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
  debug: process.env.NODE_ENV === "development",
};
