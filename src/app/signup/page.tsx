import { HealthDisclaimer } from "@/components/disclaimer";
import { SignUpForm } from "@/components/signup-form";
import Link from "next/link";

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

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16 animate-fade-up">
      <div className="mb-6 flex flex-col items-center text-center">
        <MoonMark />
        <h1 className="mt-4 text-2xl font-semibold text-rose-950">Create your Auralyn space</h1>
        <p className="mt-1 text-sm text-rose-900/75">Minimal data. You stay in control.</p>
      </div>
      <SignUpForm />
      <p className="mt-4 text-center text-sm text-rose-900/80">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-rose-900 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
      <div className="mt-8">
        <HealthDisclaimer compact />
      </div>
    </div>
  );
}
