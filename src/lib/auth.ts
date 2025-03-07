import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import type { DefaultSession, Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import prisma from "./prisma";

// Define custom types for the session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      console.log('SignIn Callback - Account:', JSON.stringify({ 
        provider: account?.provider,
        type: account?.type,
        redirect_uri: account?.redirect_uri 
      }, null, 2));
      return true;
    },
    async session({ 
      session, 
      user 
    }: { 
      session: Session; 
      user: User & { role: Role; id: string; }
    }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  trustHost: true,
}); 