import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize NextAuth handler
const handler = NextAuth(authOptions);

// Export handlers - NextAuth handles errors internally
export { handler as GET, handler as POST };
