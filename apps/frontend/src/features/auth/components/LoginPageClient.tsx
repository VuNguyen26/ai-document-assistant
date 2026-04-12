"use client";

import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";

export default function LoginPageClient() {
  useSearchParams();

  return <LoginForm />;
}