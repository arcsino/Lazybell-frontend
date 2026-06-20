"use client";
import { useState } from "react";
import {
  Users,
  Calendar,
  CheckCircle2,
  Shield,
  Tag,
  BookOpen,
  Bell,
  Lock,
  Webhook,
  BellRing,
  FileText,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  UserPlus,
  FolderPlus,
  Edit2,
  Trash2,
  Crown,
  LogOut,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const sections: Section[] = [
    {
      id: "account",
      icon: <UserPlus className="h-5 w-5" />,
      title: "アカウント・プロフィール",
      content: (
        <div className="space-y-4">
          <HelpBlock title="新規登録">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>トップページまたはログイン画面から「新規登録」をクリック</li>
              <li>
                ユーザー名（英数字・アンダースコア）・ニックネーム・メールアドレス・パスワードを入力
              </li>
              <li>
                「登録する」ボタンを押すと自動でログインされ、ダッシュボードへ遷移
              </li>
            </ol>
          </HelpBlock>
          <HelpBlock title="プロフィール編集">
            <p className="text-sm text-zinc-600">
              サイドバーの「プロフィール」からニックネーム・自己紹介を変更できます。ユーザー名とメールアドレスの変更は現在非対応です。
            </p>
          </HelpBlock>
          <HelpBlock title="パスワードを変更する">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>サイドバーの「プロフィール」を開く</li>
              <li>「パスワード変更」カードで現在のパスワードと新しいパスワードを入力</li>
              <li>「パスワードを変更」ボタンで確定</li>
              <li>変更が完了すると自動的にログアウトされ、ログイン画面へ遷移します</li>
              <li>新しいパスワードで再ログインしてください</li>
            </ol>
            <Note className="mt-2">新しいパスワードは8文字以上・英字・数字・特殊文字をそれぞれ含める必要があります。変更後は全デバイスのセッションが無効になります。</Note>
          </HelpBlock>
          <HelpBlock title="ログアウト">
            <p className="text-sm text-zinc-600">
              サイドバー下部のログアウトボタンをクリックするとセッションが終了しトップページへ戻ります。
            </p>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "group",
      icon: <Users className="h-5 w-5" />,
      title: "グループ管理",
      content: (
        <div className="space-y-4">
          <HelpBlock title="グループを作成する">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>サイドバーの「グループ」→「新規グループ作成」をクリック</li>
              <li>
                グループ名（必須）・説明・公開/非公開・最大メンバー数を設定
              </li>
              <li>
                「作成する」で即時作成。作成者は自動的にオーナーになります
              </li>
            </ol>
          </HelpBlock>
          <HelpBlock title="グループに参加する">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>公開グループ</strong>:
                グループ一覧または詳細画面の「グループに参加」ボタンで参加リクエストを送信。オーナー/招待権限者が承認後に参加確定
              </li>
              <li>
                <strong>非公開グループ</strong>:
                オーナーまたは招待権限を持つメンバーが「招待」機能でユーザーIDを指定して招待。「招待」ページで承認するとグループに参加
              </li>
            </ul>
          </HelpBlock>
          <HelpBlock title="グループ設定を変更する（要権限: グループ編集）">
            <p className="text-sm text-zinc-600">
              グループ詳細の「設定」タブ →
              「グループ情報」カードの「編集」ボタンから、グループ名・説明・公開設定・最大メンバー数を変更できます。
            </p>
          </HelpBlock>
          <HelpBlock title="オーナー移譲">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>「設定」タブ → 「危険な操作」カード内の「オーナーを移譲」をクリック</li>
              <li>ドロップダウンから新しいオーナーにするメンバーを選択</li>
              <li>「移譲する」ボタンで確定</li>
            </ol>
            <Note className="mt-2">移譲後は新オーナーのみがグループ削除・再移譲を行えます。自分はオーナー権限を失います。</Note>
          </HelpBlock>
          <HelpBlock title="グループを退出する">
            <p className="text-sm text-zinc-600">
              設定タブ「危険な操作」→「グループを退出」。オーナーは移譲後でないと退出できません。
            </p>
          </HelpBlock>
          <HelpBlock title="グループを削除する（オーナーのみ）">
            <p className="text-sm text-zinc-600">
              設定タブ「危険な操作」→「グループを削除」。削除するとすべてのスケジュール・メンバーデータが完全に削除されます。この操作は元に戻せません。
            </p>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "members",
      icon: <UserPlus className="h-5 w-5" />,
      title: "メンバー管理",
      content: (
        <div className="space-y-4">
          <HelpBlock title="メンバーを招待する（要権限: ユーザー招待）">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>「メンバー」タブ → 「招待」ボタンをクリック</li>
              <li>
                招待したいユーザーの UUID（ユーザーID）を入力して「招待を送る」
              </li>
              <li>
                対象ユーザーの「招待」ページに通知が届き、承認するとグループに参加
              </li>
            </ol>
            <Note className="mt-2">
              ユーザーIDはプロフィールページで確認できます。
            </Note>
          </HelpBlock>
          <HelpBlock title="参加リクエストを承認/拒否する（要権限: ユーザー招待）">
            <p className="text-sm text-zinc-600">
              「メンバー」タブ上部の「参加リクエスト」セクションに承認待ちメンバーが表示されます。「承認」で参加確定、「拒否」でBanします。
            </p>
          </HelpBlock>
          <HelpBlock title="メンバーを削除する（要権限: メンバー削除）">
            <p className="text-sm text-zinc-600">
              メンバーリストの各行のゴミ箱アイコンをクリック。オーナーと自分自身は削除できません。
            </p>
          </HelpBlock>
          <HelpBlock title="メンバーをBanする（要権限: メンバー削除）">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li><strong>参加リクエストから</strong>: 「参加リクエスト」セクションの「拒否」ボタンを押すとBan</li>
              <li><strong>参加済みメンバーから</strong>: メンバーリストの Ban アイコン（斜線付きの禁止マーク）をクリック</li>
            </ul>
            <Note className="mt-2">Banされたユーザーは再参加できません。Ban解除が必要な場合は「Banされたメンバー」セクションから解除できます。</Note>
          </HelpBlock>
          <HelpBlock title="Banを解除する（要権限: メンバー削除）">
            <p className="text-sm text-zinc-600">
              「メンバー」タブ下部の「Banされたメンバー」セクションに Ban 済みユーザーが表示されます。「Ban解除」ボタンをクリックすると Ban が解除され、ユーザーは再参加できるようになります。
            </p>
          </HelpBlock>
          <HelpBlock title="ロールで絞り込む">
            <p className="text-sm text-zinc-600">
              「メンバー」タブ上部の「ロール:」フィルターボタンをクリックすると、そのロールを持つメンバーのみ表示されます。「すべて」をクリックすると解除。
            </p>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "roles",
      icon: <Shield className="h-5 w-5" />,
      title: "ロール・権限管理",
      content: (
        <div className="space-y-4">
          <HelpBlock title="ロールの仕組み">
            <p className="text-sm text-zinc-600 mb-3">
              グループ内でのメンバーの操作範囲をロールで管理します。オーナーは全権限を持ち、それ以外のメンバーはロールに付与された権限のみ操作可能です。
            </p>
            <div className="rounded-lg border border-zinc-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      権限名
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      できること
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[
                    [
                      "ユーザー招待",
                      "メンバーへの招待送信、参加リクエストの承認/拒否",
                    ],
                    ["メンバー削除", "メンバーの削除・Ban"],
                    [
                      "ロール管理",
                      "ロールの作成/削除、メンバーへのロール付与/剥奪",
                    ],
                    [
                      "グループ編集",
                      "グループ名・説明・公開設定・最大人数の変更",
                    ],
                    ["スケジュール編集", "スケジュールの作成・編集・削除"],
                    ["科目管理", "科目の作成・編集・削除"],
                    [
                      "タグ管理",
                      "タグの作成・編集（名前・色）・削除・並び替え",
                    ],
                    ["Webhook管理", "Discord Webhookの登録・編集・削除"],
                  ].map(([name, desc]) => (
                    <tr key={name}>
                      <td className="px-4 py-2 font-medium text-zinc-800 whitespace-nowrap">
                        {name}
                      </td>
                      <td className="px-4 py-2 text-zinc-500">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HelpBlock>
          <HelpBlock title="ロールを作成する（要権限: ロール管理）">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>「ロール」タブ → 「新規ロール」ボタンをクリック</li>
              <li>ロール名を入力し、付与したい権限にチェックを入れる</li>
              <li>「ロールを作成」で確定</li>
            </ol>
          </HelpBlock>
          <HelpBlock title="メンバーにロールを付与/剥奪する（要権限: ロール管理）">
            <p className="text-sm text-zinc-600">
              「メンバー」タブで対象ユーザーの盾アイコンをクリック →
              「ロールを管理」ダイアログで付与/削除。1人のメンバーに複数ロールを付与可能です。
            </p>
          </HelpBlock>
          <Note>
            ロールの削除時はそのロールを持つメンバー全員からロールが剥奪されます。
          </Note>
        </div>
      ),
    },
    {
      id: "schedules",
      icon: <Calendar className="h-5 w-5" />,
      title: "スケジュール",
      content: (
        <div className="space-y-4">
          <HelpBlock title="スケジュールを作成する（要権限: スケジュール編集）">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>
                「スケジュール」タブ → 「スケジュール追加」ボタンをクリック
              </li>
              <li>
                タイトル（必須）・詳細・開始日時・締め切り・科目・タグを設定
              </li>
              <li>「終日イベント」をオンにすると日付のみの入力になります</li>
              <li>「保存」で登録完了</li>
            </ol>
            <Note className="mt-2">
              日時はすべて日本標準時（JST）で入力・表示されます。
            </Note>
          </HelpBlock>
          <HelpBlock title="スケジュールを編集・削除する（要権限: スケジュール編集）">
            <p className="text-sm text-zinc-600">
              スケジュールカードの鉛筆ボタンまたは詳細画面の編集/削除ボタンから操作できます。削除は論理削除で、1週間後に完全削除されます。
            </p>
          </HelpBlock>
          <HelpBlock title="完了チェックをする">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                一覧画面のカードにあるチェックボタンで完了/未完了を切り替え
              </li>
              <li>
                詳細画面の「完了にする」/「未完了に戻す」ボタンでも同様に操作可能
              </li>
              <li>
                完了状態はメンバーごとに独立して管理されます（他人の完了は変更不可）
              </li>
            </ul>
          </HelpBlock>
          <HelpBlock title="スケジュールを絞り込む">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>状態フィルター</strong>:
                「すべて」「未完了」「完了」の3種類
              </li>
              <li>
                <strong>科目フィルター</strong>:
                科目名ボタンをクリックして特定科目のみ表示
              </li>
              <li>
                <strong>タグフィルター</strong>:
                タグピルをクリックして特定タグを含むもののみ表示
              </li>
              <li>
                複数フィルターは AND
                条件で適用されます。「絞り込みをリセット」で一括解除
              </li>
            </ul>
          </HelpBlock>
          <HelpBlock title="カレンダーで確認する">
            <p className="text-sm text-zinc-600">
              サイドバーの「カレンダー」から月次カレンダーで締め切りを視覚的に確認できます。タグの色がドットとして表示されます。
            </p>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "subject-tag",
      icon: <Tag className="h-5 w-5" />,
      title: "科目・タグ",
      content: (
        <div className="space-y-4">
          <HelpBlock title="科目を管理する（要権限: 科目管理）">
            <p className="text-sm text-zinc-600 mb-2">
              グループ詳細の「設定」タブ → 「科目」カードから操作できます。
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>作成</strong>:
                テキストフィールドに科目名を入力して「＋」ボタンまたはEnterキー
              </li>
              <li>
                <strong>編集</strong>: 科目チップの鉛筆アイコンをクリック →
                インライン入力で名前を変更 →
                ✓で保存（Enterでも可）、✗またはEscでキャンセル
              </li>
              <li>
                <strong>削除</strong>:
                科目チップの「×」ボタンをクリック（即時削除）
              </li>
            </ul>
            <Note className="mt-2">
              科目名は不適切なコンテンツフィルターを通過します。変更時にのみチェックが実行されます。
            </Note>
          </HelpBlock>
          <HelpBlock title="タグを管理する（要権限: タグ管理）">
            <p className="text-sm text-zinc-600 mb-2">
              グループ詳細の「設定」タブ → 「タグ」カードから操作できます。
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>作成</strong>: カラーパレットから色を選択 → タグ名を入力
                → 「＋」ボタンまたはEnterキー
              </li>
              <li>
                <strong>編集（名前・色）</strong>:
                タグ一覧の鉛筆アイコンをクリック →
                カラーパレットで色を選択、テキストで名前を変更 → ✓で保存
              </li>
              <li>
                <strong>並び替え</strong>:
                ↑↓ボタンで表示順を変更。スケジュール画面でもこの順番で表示されます
              </li>
              <li>
                <strong>削除</strong>: 「×」ボタンをクリック（即時削除）
              </li>
            </ul>
            <Note className="mt-2">
              タグ名も科目名と同様に不適切コンテンツフィルターが適用されます。
            </Note>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "webhook",
      icon: <Webhook className="h-5 w-5" />,
      title: "Discord Webhook 通知",
      content: (
        <div className="space-y-4">
          <HelpBlock title="Webhook URLの取得方法">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>
                Discord で通知を送りたいチャンネルを右クリック →
                「チャンネルの編集」
              </li>
              <li>「連携サービス」タブ → 「Webhookを作成」</li>
              <li>名前を設定して「Webhook URLをコピー」</li>
              <li>コピーした URL を Lazybell に貼り付け</li>
            </ol>
            <Note className="mt-2">
              URLは{" "}
              <code className="bg-zinc-100 px-1 rounded text-xs">
                https://discord.com/api/webhooks/...
              </code>{" "}
              の形式のみ有効です。
            </Note>
          </HelpBlock>
          <HelpBlock title="Webhookを登録する（要権限: Webhook管理）">
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
              <li>
                グループ詳細の「設定」タブ → 「Discord Webhook」カードを開く
              </li>
              <li>
                「リマインド通知」または「作成ログ通知」の「追加」ボタンをクリック
              </li>
              <li>Webhook名（任意）と Discord Webhook URL を入力</li>
              <li>
                「登録する」を押すとテスト送信を行い、URLが有効な場合のみ保存されます
              </li>
            </ol>
          </HelpBlock>
          <HelpBlock title="通知の種類">
            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <BellRing className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    リマインド通知（毎朝8時 cron）
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    翌日が締め切りのスケジュールをまとめてDiscordに送信。@everyoneメンションで通知。1グループに複数のWebhookを設定可能です。
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    作成ログ通知（即時）
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    スケジュールが作成された直後にバックグラウンドでDiscordに通知。APIレスポンスをブロックしません。
                  </p>
                </div>
              </div>
            </div>
          </HelpBlock>
          <HelpBlock title="通知Embedの内容">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>著者</strong>: Lazybell（ホームページへのリンク付き）
              </li>
              <li>
                <strong>タイトル</strong>:
                スケジュールタイトル（詳細ページへのリンク付き）
              </li>
              <li>
                <strong>説明</strong>:
                詳細文・タグ（バッククオート囲み）・科目（バッククオート囲み）・締め切り（太字・JST表示）
              </li>
              <li>
                <strong>色</strong>:
                先頭タグの色（タグなしの場合はリマインド=オレンジ・作成ログ=ブルー）
              </li>
              <li>
                <strong>フッター</strong>: 作成者のニックネーム
              </li>
            </ul>
          </HelpBlock>
          <HelpBlock title="Webhookを編集・削除する（要権限: Webhook管理）">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>編集</strong>: Webhookリストの「編集」ボタン →
                名前のみ変更する場合はURLを空にして保存。URL変更時は再度テスト送信が実行されます
              </li>
              <li>
                <strong>削除</strong>:
                ゴミ箱アイコンをクリック（確認ダイアログあり）
              </li>
            </ul>
          </HelpBlock>
          <Note>
            WebhookのURLは暗号化して保存されます。登録後のURL確認はできません。変更が必要な場合は新しいURLを入力してください。
          </Note>
        </div>
      ),
    },
    {
      id: "dashboard",
      icon: <BookOpen className="h-5 w-5" />,
      title: "ダッシュボード・カレンダー",
      content: (
        <div className="space-y-4">
          <HelpBlock title="ダッシュボードの見方">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>
                <strong>統計カード</strong>:
                参加中グループ数・未処理招待数・直近スケジュール数を表示
              </li>
              <li>
                <strong>招待セクション</strong>:
                保留中の招待を最大3件表示。「すべて表示」で招待ページへ
              </li>
              <li>
                <strong>直近のスケジュール</strong>:
                全グループの期限が近いスケジュールを表示。期限切れは赤のアラートアイコンで警告
              </li>
              <li>
                <strong>参加中のグループ</strong>:
                最大6件のグループカードを表示。「すべて表示」でグループ一覧へ
              </li>
            </ul>
          </HelpBlock>
          <HelpBlock title="カレンダーの使い方">
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600">
              <li>月次カレンダーで全グループのスケジュール締め切りを確認</li>
              <li>日付にカラードットで表示（タグの色を使用）</li>
              <li>日付をクリックするとその日のスケジュール一覧が表示</li>
              <li>「前月」「翌月」ボタンで月を切り替え</li>
            </ul>
          </HelpBlock>
        </div>
      ),
    },
    {
      id: "faq",
      icon: <HelpCircle className="h-5 w-5" />,
      title: "よくある質問",
      content: (
        <div className="space-y-4">
          <FaqItem q="スケジュールを削除すると完全に消えますか？">
            削除したスケジュールは論理削除（非表示）となり、7日後にデータが完全削除されます。削除後の復元はできません。
          </FaqItem>
          <FaqItem q="Webhookのテスト送信に失敗しました">
            Discord側でWebhookが削除・無効化されている可能性があります。Discord
            でWebhook URLを再発行し、新しいURLを登録してください。
          </FaqItem>
          <FaqItem q="リマインド通知が届きません">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>
                Webhookが正しく登録されているか確認（設定タブ → Discord
                Webhookセクション）
              </li>
              <li>
                通知はJST翌日（0:00〜23:59）が締め切りのスケジュールが対象です
              </li>
              <li>サーバーのcronが毎朝8時（JST）に実行される必要があります</li>
            </ul>
          </FaqItem>
          <FaqItem q="メンバーの完了チェックを取り消せますか？">
            自分自身の完了チェックのみ取り消せます。スケジュールカードのチェックアイコンを再クリック、または詳細画面の「未完了に戻す」ボタンで取り消せます。
          </FaqItem>
          <FaqItem q="タグの並び替えはどこに影響しますか？">
            設定タブで設定した並び順は、スケジュール一覧のタグフィルター・スケジュール作成フォームのタグ選択・カレンダーのタグドットの先頭色に影響します。
          </FaqItem>
          <FaqItem q="グループのオーナーはすべての権限を持ちますか？">
            はい。グループオーナーはロールに関係なくすべての権限を持ちます。権限設定はロールを持つ一般メンバーに対してのみ有効です。
          </FaqItem>
          <FaqItem q="科目・タグ名に使える文字は？">
            日本語・英数字・記号が使用できます。ただし、不適切なコンテンツと判定された場合は登録・更新が拒否されます。
          </FaqItem>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-brand-600" />
          ヘルプ・使い方ガイド
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          各機能の詳細な使い方と操作手順を説明します。セクションをクリックして展開してください。
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
        >
          <button
            onClick={() => toggle(section.id)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                {section.icon}
              </div>
              <span className="font-semibold text-zinc-900">
                {section.title}
              </span>
            </div>
            {openId === section.id ? (
              <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
            )}
          </button>
          {openId === section.id && (
            <div className="px-5 pb-5 pt-1 border-t border-zinc-100">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HelpBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-800 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Note({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2",
        className,
      )}
    >
      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-700">{children}</p>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-800 mb-1.5">Q. {q}</p>
      <div className="text-sm text-zinc-600 leading-relaxed">{children}</div>
    </div>
  );
}
