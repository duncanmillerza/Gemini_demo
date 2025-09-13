import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "@/lib/sheets";

// This object now maps user emails to their department.
// Add your test users and their departments here.
const userDatabase: { [email: string]: string } = {
    "duncanmillerza@gmail.com": "Cardiology",
    "another.user@gmail.com": "Neurology",
    "a.third.user@domain.com": "Oncology"
};

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
        return false; // Can't sign in without an email
      }
      // Check if the user exists in our "Users" Google Sheet
      const user = await getUserByEmail(profile.email);
      if (user) {
        return true; // Allow sign-in
      }
      return false; // Block sign-in for anyone not in the Users sheet
    },
    async jwt({ token, profile }) {
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
      // Add the custom properties from the token to the session object
      if (session.user) {
        (session.user as any).name = token.name;
        (session.user as any).department = token.department;
      }
      return session;
    },
  },
};