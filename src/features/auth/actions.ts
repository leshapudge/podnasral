"use server";

import { signIn, signOut } from "@/lib/auth/auth";
import type { OAuthProviderId } from "@/lib/auth/providers";

export async function signInWithProvider(
  provider: OAuthProviderId,
  callbackUrl = "/?tab=kazik",
) {
  await signIn(provider, { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
