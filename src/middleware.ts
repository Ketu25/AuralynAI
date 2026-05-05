import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/calendar",
  "/history",
  "/insights",
  "/education",
  "/settings",
  "/log/",   // "/log" would match "/login" via startsWith — must include trailing slash
  "/onboarding",
];

// Computed once at module load — never changes between requests.
const supabaseCookiePrefix = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "sb-";
  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  } catch {
    return "sb-";
  }
})();

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check only: supabase-js derives the browser cookie name from the
  // project ref, e.g. "sb-zftomzudmyixfgrsyjic-auth-token" and chunks it as
  // ".0", ".1", etc. We only read cookies here — no network calls in proxy.
  // Real validation happens in requireUser().
  const hasSession = request.cookies.getAll().some((c) =>
    c.name.startsWith(supabaseCookiePrefix),
  );

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  // Only redirect unauthenticated users away from protected routes.
  // Auth page redirects (login/signup → dashboard) are handled inside the page
  // components themselves, where the session can be properly validated.
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
