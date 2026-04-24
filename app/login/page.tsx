import GoogleSignIn from "../components/google-sign-in";
import { hasSupabaseEnv } from "../../lib/env";

export const metadata = {
  title: "Login | URLベース チャットボット",
  description: "Google ログインでダッシュボードとアカウント画面に入れます。",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f9fffe_0%,_#edf4f7_100%)] px-4 py-16">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            Secure Access
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            ダッシュボードへ入るには Google ログインを使います
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            URL クロール、ウィジェット設定、会話ログ確認、料金プラン管理はログイン後に利用できます。
            顧客向けデモや本番運用の前提として、まずはこの認証導線を使います。
          </p>
          <ul className="space-y-3 text-sm leading-7 text-slate-700">
            <li>Google OAuth によるサインイン</li>
            <li>ダッシュボードとアカウント画面を保護</li>
            <li>Same-Origin チェック付き API</li>
          </ul>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold text-slate-950">ログイン</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Google アカウントでサインインすると、`/dashboard` と `/account` にアクセスできます。
          </p>

          <div className="mt-6">
            {hasSupabaseEnv() ? (
              <GoogleSignIn />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                Supabase の環境変数が不足しています。
                `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`
                を設定すると Google ログインを有効化できます。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
