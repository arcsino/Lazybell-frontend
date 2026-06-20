"use client";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Users,
  Shield,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  FolderPlus,
  ListChecks,
  Check,
  ChevronRight,
  Zap,
  Lock,
  Tag,
  BookOpen,
  Webhook,
  BellRing,
  FileText,
  Filter,
  Clock,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white antialiased">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-zinc-950">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 transition-all group-hover:bg-brand-500">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Lazybell</span>
          </Link>

          <div className="flex items-center gap-3">
            {!isLoading &&
              (isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-brand-500"
                >
                  ダッシュボード <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-brand-500"
                  >
                    新規登録 <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ))}
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-white pt-36 pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-brand-100/60 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">
            <Zap className="h-3 w-3" />
            チームスケジュール管理
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-7xl">
            チームの予定を、
            <br />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-400 bg-clip-text text-transparent">
              もっとシンプルに。
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-zinc-500">
            Lazybell はグループ単位でスケジュールを共有・管理できるリマインダーアプリです。
            Discord Webhook 通知・完了チェック・タグ分類・ロール権限管理など、
            チーム運営に必要な機能をすべて備えています。
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoading ? (
              <div className="h-[52px]" />
            ) : isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700"
              >
                ダッシュボードへ
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700"
                >
                  新規登録
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl border border-zinc-300 px-8 py-3.5 text-base font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:text-zinc-900"
                >
                  ログイン
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Core Features ──────────────────────────────────────── */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-brand-600">
            機能
          </p>
          <h2 className="mb-14 text-center text-3xl font-bold text-zinc-900">
            チームをつなぐ、すべての機能
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Users className="h-5 w-5 text-brand-600" />}
              title="グループ管理"
              description="複数のグループを作成・参加。プライベート設定で招待制にも対応。最大メンバー数の設定、オーナー移譲、退出も可能です。"
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5 text-brand-600" />}
              title="スケジュール共有"
              description="タイトル・詳細・開始日時・締め切り・終日フラグを設定して登録。科目・タグ・完了状態で絞り込み表示ができます。"
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5 text-brand-600" />}
              title="完了チェック"
              description="スケジュールごとに個人の完了状況を記録・取り消し。詳細画面でメンバー全員の完了履歴と完了日時を一覧確認できます。"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-brand-600" />}
              title="ロール・権限管理"
              description="招待・メンバー削除・ロール管理・グループ編集・スケジュール編集・科目管理・タグ管理・Webhook管理の8種類の権限をロール単位で設定できます。"
            />
            <FeatureCard
              icon={<Tag className="h-5 w-5 text-brand-600" />}
              title="タグ・科目分類"
              description="カラーコード付きのタグと科目でスケジュールを分類。タグは色変更・名前変更・並び替えに対応。スケジュール一覧でタグ・科目フィルタが使えます。"
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5 text-brand-600" />}
              title="Discord Webhook 通知"
              description="リマインド通知（毎朝8時、翌日期限のスケジュール）と作成ログ通知（登録即時）をDiscordに送信。グループごとに複数Webhook設定可能。"
            />
            <FeatureCard
              icon={<Lock className="h-5 w-5 text-brand-600" />}
              title="プライベートグループ"
              description="非公開グループは招待制。オーナーが承認したユーザーのみ参加可能。参加リクエストの承認・拒否もワンクリックで対応。"
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5 text-brand-600" />}
              title="ダッシュボード"
              description="参加グループ数・未処理招待数・直近スケジュール数を一目で確認。期限切れスケジュールはアラートアイコンで警告表示されます。"
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-brand-600" />}
              title="カレンダー表示"
              description="月次カレンダーでスケジュールの期限を視覚的に確認。色付きタグドットで分類が一目でわかります。"
            />
          </div>
        </div>
      </section>

      {/* ── Webhook detail ─────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-brand-600">
            Discord 連携
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-zinc-900">
            Webhook で自動通知
          </h2>
          <p className="mb-14 text-center text-base text-zinc-500 max-w-2xl mx-auto">
            グループの設定タブから Discord Webhook URL を登録するだけで、スケジュール情報がリッチな Embed 形式で届きます。
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <WebhookTypeCard
              icon={<BellRing className="h-5 w-5 text-amber-500" />}
              title="リマインド通知"
              badge="毎朝8時 (cron)"
              items={[
                "翌日が締め切りのスケジュールをまとめて通知",
                "@everyone メンションで全員に周知",
                "1グループに複数のWebhookを設定可能",
                "Embedにはタイトル・詳細・タグ・科目・締め切り（JST）・作成者を表示",
              ]}
            />
            <WebhookTypeCard
              icon={<FileText className="h-5 w-5 text-blue-500" />}
              title="作成ログ通知"
              badge="即時送信"
              items={[
                "スケジュール作成時に即座にDiscordへ通知",
                "バックグラウンド処理なのでAPIレスポンスをブロックしない",
                "1グループに複数のWebhookを設定可能",
                "Embedにはタイトル・詳細・タグ・科目・締め切り（JST）・作成者を表示",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── How to use ─────────────────────────────────────────── */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-brand-600">
            使い方
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold text-zinc-900">
            4ステップで始められる
          </h2>

          <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-4 lg:gap-8">
            <div
              aria-hidden
              className="absolute top-[1.0625rem] left-[12.5%] right-[12.5%] hidden h-px bg-brand-100 lg:block"
            />
            <Step
              number="01"
              icon={<UserPlus className="h-5 w-5" />}
              title="アカウント作成"
              description="ユーザー名・ニックネーム・メールアドレス・パスワードを入力して登録。完了後は自動でログインされます。"
            />
            <Step
              number="02"
              icon={<FolderPlus className="h-5 w-5" />}
              title="グループ作成"
              description="「グループ」ページから新しいグループを作成。既存グループへの招待は「招待」ページから承認します。"
            />
            <Step
              number="03"
              icon={<ListChecks className="h-5 w-5" />}
              title="スケジュール追加"
              description="グループのスケジュールタブから「スケジュール追加」をクリック。タイトル・期限・タグ・科目を設定します。"
            />
            <Step
              number="04"
              icon={<Check className="h-5 w-5" />}
              title="完了チェック"
              description="チェックボタンまたは詳細画面の「完了にする」を押すと自分の完了が記録されます。"
              isLast
            />
          </div>
        </div>
      </section>

      {/* ── Help CTA ───────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 mb-4">
            <HelpCircle className="h-6 w-6 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">
            詳しい使い方はヘルプへ
          </h2>
          <p className="text-zinc-500 mb-6">
            各機能の詳細な操作手順・権限ガイド・Webhook設定方法など、すべての使い方をまとめています。
          </p>
          {isAuthenticated && (
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              ヘルプを見る <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600/80 transition-all group-hover:bg-brand-600">
              <Bell className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400 transition-colors group-hover:text-white">
              Lazybell
            </span>
          </Link>
          <p className="text-xs text-zinc-600">© 2026 Lazybell</p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-md">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function WebhookTypeCard({
  icon,
  title,
  badge,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-200">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900">{title}</h3>
          <span className="text-xs font-medium text-zinc-400">{badge}</span>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
            <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
  isLast = false,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-5 pb-10 lg:flex-col lg:items-center lg:pb-0 lg:text-center">
      {!isLast && (
        <div
          aria-hidden
          className="absolute left-[1.0625rem] top-9 bottom-0 w-px bg-brand-100 lg:hidden"
        />
      )}
      <div className="relative z-10 flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-200 ring-4 ring-white">
        {icon}
      </div>
      <div className="pt-1 lg:pt-0">
        <span className="mb-1 block text-xs font-semibold tracking-widest text-brand-500">
          STEP {number}
        </span>
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
