import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      department?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    department?: string | null;
  }
}

