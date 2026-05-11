import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

const PROTECTED_PREFIXES = ["/library", "/chat", "/draft", "/admin"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  // If Supabase isn't configured yet (e.g., fresh clone before .env.local is
  // filled in), skip auth so the marketing site still loads. The README
  // documents the setup; layouts of protected routes will surface their own
  // error if someone bypasses the proxy without env vars.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  // Refresh + read the user's session, propagating any Set-Cookie headers
  // back on the response.
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Signed-out user hitting a protected route → redirect to sign-in.
  if (isProtected(path) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed-in user hitting an auth page → bounce to library.
  if (AUTH_PAGES.includes(path) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/library";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon files
     * - other public assets (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.svg|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
