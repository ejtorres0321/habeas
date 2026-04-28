import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/auth/signin", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
