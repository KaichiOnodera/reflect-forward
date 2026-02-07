"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        ようこそ、{user?.displayName || user?.email} さん
      </h2>
      <Card>
        <p className="text-gray-600">日記機能は今後のアップデートで追加予定です。</p>
      </Card>
    </div>
  );
}
