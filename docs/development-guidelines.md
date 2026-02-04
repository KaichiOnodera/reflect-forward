# Reflect Forward - 開発ガイドライン

## 1. コーディング規約

### 1.1 TypeScript

#### 型定義

| ルール | 例 |
|--------|-----|
| `any` の使用禁止 | `unknown` または具体的な型を使用 |
| 型推論を活用 | 明示的な型注釈は必要な場合のみ |
| `interface` vs `type` | オブジェクト型は `interface`、ユニオン等は `type` |
| Non-null assertion (`!`) 禁止 | Optional chaining (`?.`) を使用 |

```typescript
// Good
interface User {
  id: string;
  email: string;
  displayName: string | null;
}

const user = await getUser(id);
const name = user?.displayName ?? 'ゲスト';

// Bad
const user: any = await getUser(id);
const name = user!.displayName;
```

#### 関数

| ルール | 説明 |
|--------|------|
| アロー関数を優先 | 特にコールバック、コンポーネント |
| 引数は3つまで | 4つ以上はオブジェクトでまとめる |
| 早期リターン | ネストを減らす |
| 副作用を明示 | 関数名で副作用を示す（`save`, `delete` 等） |

```typescript
// Good
const createEntry = async ({ content, rating, entryDate }: CreateEntryInput) => {
  if (!content && !rating) {
    throw new Error('Content or rating is required');
  }
  return await prisma.diaryEntry.create({ data: { content, rating, entryDate } });
};

// Bad
const createEntry = async (content, rating, entryDate, userId, shortMemo) => {
  if (content || rating) {
    return await prisma.diaryEntry.create({
      data: { content, rating, entryDate, userId, shortMemo }
    });
  } else {
    throw new Error('Content or rating is required');
  }
};
```

### 1.2 React / Next.js

#### コンポーネント

| ルール | 説明 |
|--------|------|
| 関数コンポーネントのみ | クラスコンポーネントは使用しない |
| Props は分割代入 | コンポーネント引数で直接分割 |
| デフォルト値は引数で | `defaultProps` は使用しない |
| `key` は一意な値 | 配列インデックスは避ける |

```typescript
// Good
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
}: ButtonProps) => {
  return (
    <button
      className={variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### Hooks

| ルール | 説明 |
|--------|------|
| カスタムフックは `use` プレフィックス | `useAuth`, `useEntries` |
| 依存配列は正確に | ESLint警告を無視しない |
| `useEffect` は最小限に | 可能なら Server Components で処理 |

```typescript
// Good
const useEntries = (page: number) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      const data = await api.getEntries(page);
      setEntries(data.entries);
      setIsLoading(false);
    };
    fetchEntries();
  }, [page]); // 依存配列を正確に

  return { entries, isLoading };
};
```

#### Server Components vs Client Components

| 種類 | 使用場面 |
|------|----------|
| Server Components（デフォルト） | データフェッチ、静的コンテンツ |
| Client Components（`'use client'`） | インタラクティブUI、状態管理、ブラウザAPI |

```typescript
// Server Component (default)
export default async function EntriesPage() {
  const entries = await getEntries(); // サーバーで実行
  return <EntryList entries={entries} />;
}

// Client Component
'use client';
export const EntryForm = () => {
  const [content, setContent] = useState('');
  // ...
};
```

### 1.3 Hono（バックエンド）

#### ルート定義

```typescript
// Good
const authRoutes = new Hono()
  .post('/register', zValidator('json', registerSchema), async (c) => {
    const data = c.req.valid('json');
    // ...
  })
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const data = c.req.valid('json');
    // ...
  });

export default authRoutes;
```

#### エラーハンドリング

```typescript
// Good - 明示的なエラーレスポンス
if (!user) {
  return c.json({ error: 'ユーザーが見つかりません' }, 404);
}

// Bad - 例外を投げるだけ
if (!user) {
  throw new Error('User not found');
}
```

---

## 2. 命名規則

### 2.1 ファイル名

| 種類 | 規則 | 例 |
|------|------|-----|
| React コンポーネント | PascalCase | `EntryCard.tsx` |
| カスタムフック | camelCase + use | `useAuth.ts` |
| ユーティリティ | camelCase | `api.ts`, `utils.ts` |
| 型定義 | camelCase | `user.ts`, `entry.ts` |
| ルート（API） | camelCase | `auth.ts`, `entries.ts` |
| テスト | 元ファイル名 + `.test` | `auth.test.ts` |

### 2.2 変数・関数名

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数 | camelCase | `userId`, `entryDate` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_CONTENT_LENGTH` |
| 関数 | camelCase + 動詞 | `getUser`, `createEntry` |
| Boolean | is/has/can プレフィックス | `isLoading`, `hasError` |
| イベントハンドラ | handle プレフィックス | `handleSubmit`, `handleClick` |
| コールバック Props | on プレフィックス | `onSubmit`, `onClick` |

### 2.3 型・インターフェース

| 種類 | 規則 | 例 |
|------|------|-----|
| Interface | PascalCase | `User`, `DiaryEntry` |
| Type | PascalCase | `CreateEntryInput` |
| Enum | PascalCase | `UserRole` |
| Generics | T, U, V または意味のある名前 | `TData`, `TError` |

### 2.4 データベース

| 種類 | 規則 | 例 |
|------|------|-----|
| テーブル名 | snake_case（複数形） | `users`, `diary_entries` |
| カラム名 | snake_case | `user_id`, `entry_date` |
| 主キー | `id` | `id` |
| 外部キー | 参照テーブル名（単数）+ `_id` | `user_id` |
| タイムスタンプ | `created_at`, `updated_at` | - |

---

## 3. スタイリング規約

### 3.1 Tailwind CSS

#### クラスの順序

```tsx
// 推奨順序
<div
  className="
    flex items-center justify-between     // レイアウト
    w-full max-w-md                        // サイズ
    p-4 mx-auto                            // スペーシング
    bg-white border border-gray-200        // 背景・ボーダー
    rounded-lg shadow-md                   // 装飾
    text-gray-900 font-medium              // テキスト
    hover:bg-gray-50                       // 状態
    transition-colors                      // アニメーション
  "
>
```

#### 条件付きクラス

```tsx
// clsx または cn を使用
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md font-medium',
    variant === 'primary' && 'bg-blue-500 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-800',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
```

#### レスポンシブ

```tsx
// モバイルファースト
<div className="
  flex flex-col          // モバイル: 縦並び
  md:flex-row            // タブレット以上: 横並び
  gap-4
  md:gap-8
">
```

### 3.2 デザイントークン

| カテゴリ | 値 |
|----------|-----|
| 角丸 | `rounded-md`（デフォルト）, `rounded-lg`（カード） |
| シャドウ | `shadow-sm`（ボタン）, `shadow-md`（カード） |
| 間隔 | 4の倍数（`p-4`, `gap-8`, `mt-12`） |
| フォントサイズ | `text-sm`, `text-base`, `text-lg`, `text-xl` |

### 3.3 カラーパレット

| 用途 | クラス |
|------|--------|
| プライマリ | `blue-500`, `blue-600`（hover） |
| 背景 | `white`, `gray-50`, `gray-100` |
| テキスト | `gray-900`（見出し）, `gray-700`（本文）, `gray-500`（補助） |
| ボーダー | `gray-200`, `gray-300` |
| エラー | `red-500` |
| 成功 | `green-500` |

---

## 4. テスト規約

### 4.1 テスト方針

| レイヤー | テスト種別 | ツール |
|----------|-----------|--------|
| 共有パッケージ | ユニットテスト | Vitest |
| API | 統合テスト | Vitest |
| フロントエンド | コンポーネントテスト | Vitest + Testing Library |
| E2E | E2Eテスト（MVP後） | Playwright |

### 4.2 テストファイルの配置

```
src/
├── lib/
│   ├── jwt.ts
│   └── jwt.test.ts      # 同一ディレクトリに配置
├── routes/
│   ├── auth.ts
│   └── auth.test.ts
```

### 4.3 テストの書き方

#### 命名規則

```typescript
describe('createEntry', () => {
  it('should create an entry with valid input', async () => {
    // ...
  });

  it('should throw error when content and rating are both empty', async () => {
    // ...
  });
});
```

#### AAA パターン

```typescript
it('should return user when credentials are valid', async () => {
  // Arrange
  const email = 'test@example.com';
  const password = 'password123';
  await createUser({ email, password });

  // Act
  const result = await login({ email, password });

  // Assert
  expect(result.user.email).toBe(email);
  expect(result.accessToken).toBeDefined();
});
```

### 4.4 テストカバレッジ目標

| 対象 | 目標 |
|------|------|
| 共有パッケージ（validations） | 90% |
| API（routes） | 80% |
| ユーティリティ（lib） | 80% |
| フロントエンド | MVP後に設定 |

---

## 5. Git 規約

### 5.1 ブランチ命名

| 種類 | 形式 | 例 |
|------|------|-----|
| 機能追加 | `feature/簡潔な説明` | `feature/auth-login` |
| バグ修正 | `fix/簡潔な説明` | `fix/token-refresh` |
| リファクタ | `refactor/簡潔な説明` | `refactor/api-client` |
| ドキュメント | `docs/簡潔な説明` | `docs/api-specification` |

### 5.2 コミットメッセージ

#### 形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `style` | コードの意味に影響しない変更（フォーマット等） |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスやツールの変更 |

#### 例

```
feat(auth): ユーザー登録機能を実装

- registerSchemaによるバリデーション追加
- bcryptによるパスワードハッシュ化
- JWTトークン生成

Closes #12
```

```
fix(api): リフレッシュトークンの期限切れ判定を修正

expires_atがnullの場合にエラーが発生していた問題を修正

Fixes #45
```

### 5.3 プルリクエスト

#### タイトル

```
[feat] ユーザー登録機能の実装
[fix] ログイン時のエラーハンドリング修正
[docs] API仕様書の更新
```

#### テンプレート

```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更内容
- [ ] 機能追加/変更
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新

## 詳細
<!-- 実装の詳細、技術的な決定事項など -->

## テスト
<!-- テスト方法、確認した動作 -->

## スクリーンショット
<!-- UIの変更がある場合 -->

## チェックリスト
- [ ] 型チェックが通る（`pnpm typecheck`）
- [ ] リントが通る（`pnpm lint`）
- [ ] テストが通る（`pnpm test`）
- [ ] 関連ドキュメントを更新した
```

### 5.4 マージ戦略

| ブランチ | 戦略 |
|----------|------|
| feature → main | Squash and merge |
| fix → main | Squash and merge |
| hotfix → main | Merge commit |

---

## 6. コードレビュー

### 6.1 レビュー観点

| 観点 | チェック内容 |
|------|-------------|
| 機能 | 要件を満たしているか |
| 設計 | 適切な責務分離、再利用性 |
| セキュリティ | 入力検証、認証・認可 |
| パフォーマンス | 不要な再レンダリング、N+1クエリ |
| テスト | 十分なカバレッジ、エッジケース |
| 可読性 | 命名、コメント、複雑度 |

### 6.2 レビューコメント

| プレフィックス | 意味 |
|---------------|------|
| `[must]` | 必ず修正が必要 |
| `[should]` | 修正を推奨 |
| `[nit]` | 細かい指摘（任意） |
| `[question]` | 質問・確認 |

```
[must] SQLインジェクションの可能性があります。Prismaのパラメータ化クエリを使用してください。

[should] この関数は複数の責務を持っています。分割を検討してください。

[nit] 変数名 `d` は `date` の方が分かりやすいです。

[question] この処理はServer Componentで実行する必要がありますか？
```

---

## 7. セキュリティ

### 7.1 入力検証

```typescript
// すべての入力はZodで検証
import { registerSchema } from '@reflect-forward/shared';

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const data = c.req.valid('json'); // 検証済みデータ
  // ...
});
```

### 7.2 認証・認可

```typescript
// 認証が必要なルートには必ずミドルウェアを適用
app.use('/api/entries/*', authMiddleware);

// リソースのオーナーシップを確認
const entry = await prisma.diaryEntry.findFirst({
  where: { id, userId: c.get('userId') }, // userIdで絞り込み
});
if (!entry) {
  return c.json({ error: '日記が見つかりません' }, 404); // 403ではなく404
}
```

### 7.3 機密情報

| 禁止事項 | 対策 |
|----------|------|
| パスワードのログ出力 | パスワードフィールドはログから除外 |
| シークレットのハードコード | 環境変数を使用 |
| .envのコミット | .gitignoreに追加 |

---

## 8. エラーハンドリング

### 8.1 バックエンド

```typescript
// 明示的なエラーレスポンス
if (!user) {
  return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401);
}

// 予期しないエラーはグローバルハンドラーで処理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});
```

### 8.2 フロントエンド

```typescript
// API呼び出しはtry-catchでラップ
const handleSubmit = async (data: FormData) => {
  try {
    await api.createEntry(data);
    router.push('/entries');
  } catch (error) {
    if (error instanceof ApiError) {
      setError(error.message);
    } else {
      setError('予期しないエラーが発生しました');
    }
  }
};
```

---

## 9. パフォーマンス

### 9.1 フロントエンド

| 対策 | 説明 |
|------|------|
| 画像最適化 | `next/image` を使用 |
| コード分割 | 動的インポート（`dynamic`） |
| メモ化 | `useMemo`, `useCallback` は必要な場合のみ |
| Server Components | データフェッチはサーバーで |

### 9.2 バックエンド

| 対策 | 説明 |
|------|------|
| N+1クエリ回避 | `include` で関連データを一括取得 |
| ページネーション | `take`, `skip` で制限 |
| インデックス | 頻繁にクエリするカラムにインデックス |
| 接続プール | Prismaのデフォルト設定を使用 |

```typescript
// Good - includeで一括取得
const entries = await prisma.diaryEntry.findMany({
  where: { userId },
  include: { user: true },
  take: 20,
  skip: (page - 1) * 20,
});

// Bad - N+1クエリ
const entries = await prisma.diaryEntry.findMany({ where: { userId } });
for (const entry of entries) {
  const user = await prisma.user.findUnique({ where: { id: entry.userId } });
}
```

---

## 10. ドキュメンテーション

### 10.1 コードコメント

| 場面 | 対応 |
|------|------|
| 自明なコード | コメント不要 |
| 複雑なロジック | なぜそうしたかを説明 |
| TODO/FIXME | 必ず理由を記載 |

```typescript
// Good
// リフレッシュトークンのレースコンディション対策のため、
// 10秒間は旧トークンも有効とする
const graceperiod = 10 * 1000;

// Bad
// ユーザーを取得する
const user = await getUser(id);
```

### 10.2 JSDoc

公開API、ユーティリティ関数にはJSDocを記載。

```typescript
/**
 * JWTアクセストークンを生成する
 * @param userId - ユーザーID
 * @param email - メールアドレス
 * @returns 署名済みJWTトークン
 */
export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
};
```
