/** Проверка env для Auth.js / Twitch OAuth (без утечки секретов). */
export function getTwitchOAuthCredentials() {
  const clientId = process.env.AUTH_TWITCH_ID || process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.AUTH_TWITCH_SECRET || process.env.TWITCH_CLIENT_SECRET;
  return { clientId, clientSecret };
}

export function isAuthConfigured(): boolean {
  const { clientId, clientSecret } = getTwitchOAuthCredentials();
  return Boolean(process.env.AUTH_SECRET && clientId && clientSecret);
}

export function authConfigIssues(): string[] {
  const issues: string[] = [];
  if (!process.env.AUTH_SECRET) issues.push("AUTH_SECRET");
  const { clientId, clientSecret } = getTwitchOAuthCredentials();
  if (!clientId) issues.push("AUTH_TWITCH_ID или TWITCH_CLIENT_ID");
  if (!clientSecret) issues.push("AUTH_TWITCH_SECRET или TWITCH_CLIENT_SECRET");
  if (!process.env.DATABASE_URL) issues.push("DATABASE_URL");
  return issues;
}
