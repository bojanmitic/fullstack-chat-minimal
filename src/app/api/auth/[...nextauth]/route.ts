import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Export NextAuth handler
// The validation in auth.ts will throw an error if NEXTAUTH_SECRET is missing
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
