import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "wewin_cambridge_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/resources/:path*",
    "/class/:path*",
    "/user/:path*",
    "/dashboard/:path*",
    "/vocabulary/:path*",
    "/vocab-images/:path*",
    "/game-units/:path*",
    "/student/:path*",
    "/storage/:path*",
    "/storage-history/:path*",
    "/storage-category/:path*",
  ],
};
