"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@reflect-forward/shared";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const result = loginSchema.safeParse({ email, password });
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
      await login(email, password);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setApiError(
          e.status === 401 ? "メールアドレスまたはパスワードが正しくありません" : e.message
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
      <h1 className="text-2xl font-bold text-center text-gray-900">ログイン</h1>

      {apiError && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{apiError}</div>}

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
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        ログイン
      </Button>

      <p className="text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          新規登録
        </Link>
      </p>
    </form>
  );
}
