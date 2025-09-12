
import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getUserByEmail } from "@/lib/sheets"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        return false;
      }
      const user = await getUserByEmail(profile.email);
      return !!user; // Return true if user is not null, false otherwise
    },
    async jwt({ token }) {
      // If the user's department is not yet in the token, fetch it.
      if (token.email && !token.department) {
        const user = await getUserByEmail(token.email);
        if (user) {
          token.name = user.name;
          token.department = user.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom properties from the token to the session.
      if (session.user) {
        // Types are augmented in src/types/next-auth.d.ts
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.department === "string") session.user.department = token.department;
      }
      return session;
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
