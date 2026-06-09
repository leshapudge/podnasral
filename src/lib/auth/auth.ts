import NextAuth from "next-auth";
import Twitch from "next-auth/providers/twitch";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db/prisma";
import { reconcileOAuthUser } from "@/lib/auth/reconcile-oauth-user";
import { ensureEventParticipant } from "@/lib/participants/ensure-event-participant";
import { resolveTwitchRole } from "@/lib/auth/twitch-roles";
import { syncTwitchUserProfile } from "@/lib/auth/sync-twitch-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Twitch({
      clientId: process.env.AUTH_TWITCH_ID,
      clientSecret: process.env.AUTH_TWITCH_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "twitch" || !user.id) return true;

      const twitchId = account.providerAccountId;
      const twitchLogin =
        (profile as { login?: string; preferred_username?: string })?.login ??
        (profile as { preferred_username?: string })?.preferred_username ??
        null;

      const role = resolveTwitchRole(twitchId, twitchLogin);

      await reconcileOAuthUser(user.id, twitchId, twitchLogin, role);
      await ensureEventParticipant(user.id, twitchId, twitchLogin);

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        await syncTwitchUserProfile(user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { participant: true },
        });
        session.user.id = user.id;
        session.user.role = dbUser?.role ?? "VIEWER";
        session.user.participantId = dbUser?.participant?.id ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: "twitch" },
      });
      const twitchId = account?.providerAccountId;
      if (!twitchId) return;

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      const twitchLogin = dbUser?.twitchLogin ?? null;
      const role = resolveTwitchRole(twitchId, twitchLogin);

      await reconcileOAuthUser(user.id, twitchId, twitchLogin, role);
      await ensureEventParticipant(user.id, twitchId, twitchLogin);
    },
  },
  pages: {
    signIn: "/login",
  },
});
