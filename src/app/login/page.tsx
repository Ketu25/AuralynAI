import { HealthDisclaimer } from "@/components/disclaimer";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { Suspense } from "react";

function MoonMark() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-rose-900 animate-float"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16 animate-fade-up">
      <div className="mb-6 flex flex-col items-center text-center">
        <MoonMark />
        <h1 className="mt-4 text-2xl font-semibold text-rose-950">Welcome back</h1>
        <p className="mt-1 text-sm text-rose-900/75">Your data stays private to this account.</p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-rose-50" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-rose-900/80">
        New here?{" "}
        <Link href="/signup" className="font-medium text-rose-900 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      <div className="mt-8">
        <HealthDisclaimer compact />
      </div>
    </div>
  );
}
