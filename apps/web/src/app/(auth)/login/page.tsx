import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "ログイン - Reflect Forward",
};

export default function LoginPage() {
  return <LoginForm />;
}
