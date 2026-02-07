"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Reflect Forward</h1>
      <p className="text-xl text-gray-600 mb-8">振り返って前進する</p>
      <p className="text-gray-500 mb-12">日記とAIで自己理解を深めるサービス</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          ログイン
        </Link>
        <Link
          href="/register"
          className="rounded-md border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          新規登録
        </Link>
      </div>
    </main>
  );
}
