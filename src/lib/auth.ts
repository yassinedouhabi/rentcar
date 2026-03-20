import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { compare, hash } from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        await dbConnect();

        // Check DB user first (supports changed passwords)
        const user = await User.findOne({ email });
        if (user) {
          const valid = await compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: "admin", email: user.email, name: "Administrateur" };
        }

        // Fall back to env vars (initial setup, before first password change)
        const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
        const adminPass  = process.env.ADMIN_PASSWORD ?? "";

        if (email !== adminEmail) return null;
        if (password !== adminPass) return null;

        // Auto-create DB user on first successful login so future logins use bcrypt
        try {
          const passwordHash = await hash(password, 10);
          await User.create({ email, passwordHash });
        } catch {
          // Ignore duplicate key (race condition)
        }

        return { id: "admin", email, name: "Administrateur" };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id    as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
