"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@reflect-forward/shared";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const result = registerSchema.safeParse({
      email,
      password,
      displayName: displayName || undefined,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[String(key)]) {
          fieldErrors[String(key)] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, displayName || undefined);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setApiError(
          e.status === 409
            ? "このメールアドレスは既に登録されています"
            : e.message,
        );
      } else {
        setApiError("エラーが発生しました。もう一度お試しください");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <h1 className="text-2xl font-bold text-center text-gray-900">
        新規登録
      </h1>

      {apiError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <Input
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        disabled={isSubmitting}
      />

      <Input
        label="パスワード"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="new-password"
        disabled={isSubmitting}
      />

      <Input
        label="表示名（任意）"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={errors.displayName}
        autoComplete="name"
        disabled={isSubmitting}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        登録する
      </Button>

      <p className="text-center text-sm text-gray-600">
        既にアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
