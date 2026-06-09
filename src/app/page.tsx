import { auth } from "@/lib/auth/auth";
import { MineseasonHome } from "@/components/landing/mineseason-home";

export default async function Page() {
  const session = await auth();

  return (
    <MineseasonHome
      isAuthenticated={!!session?.user}
      user={
        session?.user
          ? {
              nickname: session.user.name,
              avatar: session.user.image,
              role: session.user.role,
              primaryProvider: "twitch",
            }
          : undefined
      }
    />
  );
}
