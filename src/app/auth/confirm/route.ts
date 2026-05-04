import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the Google sign-in. You can try again whenever you're ready.",
  server_error: "Google sign-in encountered a server error. Please try again.",
  temporarily_unavailable: "Google sign-in is temporarily unavailable. Please try again shortly.",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // OAuth provider errors arrive as ?error=access_denied&error_description=...
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const message =
      OAUTH_ERROR_MESSAGES[oauthError] ??
      searchParams.get("error_description") ??
      "Sign-in was cancelled or failed. Please try again.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, origin),
    );
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "magiclink"
    | "recovery"
    | "invite"
    | "email"
    | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // PKCE token_hash flow (server-side signUp with emailRedirectTo)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // OAuth / PKCE code flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Verification failed — send back to login with a visible error
  return NextResponse.redirect(
    new URL("/login?error=confirmation-failed", origin),
  );
}
