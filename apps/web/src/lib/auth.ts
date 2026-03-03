import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb, workspaces } from "@shortkit/db";
import { nanoid } from "nanoid";
import type { Adapter } from "next-auth/adapters";

function createAdapter(): Adapter {
  if (!process.env.DATABASE_URL) {
    return {} as Adapter;
  }
  return DrizzleAdapter(getDb()) as Adapter;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAdapter(),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const db = getDb();
      const emailPrefix = user.email
        ?.split("@")[0]
        ?.replace(/[^a-z0-9-]/gi, "-")
        .toLowerCase();
      const slug =
        emailPrefix && emailPrefix.length >= 3 ? emailPrefix : nanoid(8);
      const name =
        user.name || user.email?.split("@")[0] || "My Workspace";

      await db.insert(workspaces).values({
        name,
        slug,
        ownerId: user.id,
        plan: "free",
      });
    },
  },
});
