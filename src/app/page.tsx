import { auth } from "@/lib/auth/auth";
import { PodnasralHome } from "@/components/landing/podnasral-home";

export default async function Page() {
  const session = await auth();

  return (
    <PodnasralHome
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
