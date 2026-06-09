import { auth } from "@/lib/auth/auth";
import { getUserAuthProfile } from "@/lib/auth/profile";
import { handleApiError, success } from "@/lib/api/response";
import { unauthorized } from "@/lib/api/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw unauthorized();

    const profile = await getUserAuthProfile(session.user.id);
    if (!profile) throw unauthorized();

    return success({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.image,
      role: profile.role,
      twitch: profile.twitchId
        ? { id: profile.twitchId, login: profile.twitchLogin }
        : null,
      providers: profile.accounts.map((a) => a.provider),
      participant: profile.participant,
      createdAt: profile.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
