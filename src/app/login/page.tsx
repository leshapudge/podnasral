import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { authConfigIssues, isAuthConfigured } from "@/lib/auth/env";
import { LoginButtons } from "@/components/auth/login-buttons";
import { OsSectionTitle } from "@/components/landing/os/os-section-title";
import { McPageShell } from "@/components/landing/mc-page-shell";

const errorMessages: Record<string, string> = {
  OAuthSignin: "Не удалось подключиться к Twitch. Проверьте OAuth Redirect URL в Twitch Console.",
  OAuthCallback: "Twitch вернул ошибку. Убедитесь, что redirect URL совпадает с AUTH_URL.",
  OAuthAccountNotLinked: "Этот Twitch уже привязан к другому аккаунту.",
  AccessDenied: "Доступ запрещён — ваш логин не в списке стримеров сезона.",
  Configuration:
    "Сервер авторизации не настроен. На хостинге не хватает переменных окружения (Twitch, AUTH_SECRET, DATABASE_URL).",
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

  const authReady = isAuthConfigured();
  const missingEnv = authConfigIssues();
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? errorMessages.Default)
    : !authReady
      ? errorMessages.Configuration
      : null;

  return (
    <McPageShell title="Вход · MINESEASON" closeHref="/">
      <div className="mx-auto max-w-md py-6 sm:py-10">
        <div
          className="overflow-hidden rounded-lg border-2 border-[#1a1208] p-6 sm:p-8"
          style={{
            background: "linear-gradient(180deg, #2a2118 0%, #14100c 55%, #0d0a08 100%)",
            boxShadow: "0 4px 0 #0d0a08, inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <Image
              src="/assets/mc/grass-block-3d.png"
              alt=""
              width={72}
              height={72}
              className="mc-pixel-image mb-4 drop-shadow-[4px_6px_0_rgba(0,0,0,0.45)]"
              priority
            />
            <OsSectionTitle className="justify-center">Вход стримера</OsSectionTitle>
            <p className="mt-2 text-sm text-[#7a6a52]">
              Авторизация через Twitch · профиль и аватар подтянутся автоматически
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded border border-mc-redstone/40 bg-mc-redstone/10 px-4 py-3 text-sm leading-relaxed text-[#e8a090]">
              {errorMessage}
              {!authReady && missingEnv.length > 0 && (
                <p className="mt-2 text-[11px] text-[#a89070]">
                  Не задано: {missingEnv.join(", ")}
                </p>
              )}
            </div>
          )}

          <LoginButtons
            callbackUrl={params.callbackUrl ?? "/streamer"}
            disabled={!authReady}
          />

          <p className="mt-5 text-center text-[11px] leading-relaxed text-[#6a5840]">
            Участники сезона: kazanfarik, blindzonexgod, kwwwinn, kyotowave, xu3t
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#5c4a32]">
          <Link href="/" className="text-[#a89070] underline-offset-2 hover:text-[#e8d5b0] hover:underline">
            ← На главную
          </Link>
        </p>
      </div>
    </McPageShell>
  );
}
