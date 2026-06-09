import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LoginButtons } from "@/components/auth/login-buttons";

const errorMessages: Record<string, string> = {
  OAuthSignin: "Ошибка при подключении к Twitch.",
  OAuthCallback: "Ошибка callback от провайдера.",
  OAuthAccountNotLinked: "Аккаунт уже привязан к другому пользователю.",
  AccessDenied: "Доступ запрещён.",
  Configuration: "Ошибка конфигурации сервера авторизации.",
  Default: "Не удалось войти. Попробуйте снова.",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect(params.callbackUrl ?? "/streamer");
  }

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? errorMessages.Default)
    : null;

  return (
    <main
      className="mc-os-scene"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div className="mc-os-monitor" style={{ maxWidth: 420, width: "100%", height: "auto", minHeight: 0 }}>
        <div className="mc-os-bezel">
          <span className="mc-os-bezel-title">MINESEASON</span>
        </div>
        <div className="os-scrollbar" style={{ padding: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⛏️</div>
            <h1 className="font-display text-2xl text-primary tracking-widest uppercase">
              Вход
            </h1>
            <p className="mt-2 text-sm text-[#7a6a52]">Стримерский игровой ивент</p>
          </div>

          {errorMessage && (
            <div
              className="mb-5 rounded border border-mc-redstone/50 bg-mc-redstone/10 p-3 text-sm text-mc-redstone"
            >
              {errorMessage}
            </div>
          )}

          <LoginButtons callbackUrl={params.callbackUrl ?? "/streamer"} />

          <p className="mt-6 text-center text-xs text-[#5c4a32] leading-relaxed">
            При первом входе создаётся профиль с аватаром и ником из Twitch.
          </p>

          <a href="/" className="mc-os-btn mt-6 block text-center px-4 py-2 text-[10px]">
            ← На главную
          </a>
        </div>
      </div>
    </main>
  );
}
