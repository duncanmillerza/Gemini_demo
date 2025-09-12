import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "@/lib/sheets";

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
      if (!profile?.email) return false;
      const user = await getUserByEmail(profile.email);
      return !!user;
    },
    async jwt({ token }) {
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
      if (session.user) {
        if (typeof token.name === "string") session.user.name = token.name;
        const dept = token.department;
        if (typeof dept === "string") session.user.department = dept;
      }
      return session;
    },
  },
};
