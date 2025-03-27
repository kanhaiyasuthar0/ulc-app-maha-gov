// export { auth as middleware } from "@/auth";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Check if the user is authenticated
  const isAuthenticated = !!session?.user;

  // Get the pathname from the request
  const { pathname } = request.nextUrl;

  // Define protected routes
  const adminRoutes = ["/dashboard/admin"];
  const subAdminRoutes = ["/dashboard/sub-admin"];
  const consumerRoutes = ["/dashboard/consumer"];
  const authRoutes = ["/login", "/register"];

  // Redirect authenticated users away from auth pages
  if (
    isAuthenticated &&
    authRoutes.some((route) => pathname.startsWith(route))
  ) {
    const role = session.user.role;

    // Redirect to appropriate dashboard based on role
    if (role === 1) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    } else if (role === 2) {
      return NextResponse.redirect(
        new URL("/dashboard/sub-admin", request.url)
      );
    } else {
      return NextResponse.redirect(new URL("/dashboard/consumer", request.url));
    }
  }

  // Check if the route is protected
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isSubAdminRoute = subAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isConsumerRoute = consumerRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If the route is protected and the user is not authenticated, redirect to login
  if (
    (isAdminRoute || isSubAdminRoute || isConsumerRoute) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is authenticated, check role-based access
  if (isAuthenticated) {
    const role = session.user.role;

    // Admin routes are only accessible by admins (role 1)
    if (isAdminRoute && role !== 1) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Sub-admin routes are only accessible by sub-admins (role 2)
    if (isSubAdminRoute && role !== 2) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Consumer routes are only accessible by consumers (role 3)
    if (isConsumerRoute && role !== 3) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
  unstable_allowDynamic: [
    // allows a single file
    "/lib/db.ts",
    "/auth.ts",
    "/middleware.ts",
    "/node_modules/mongoose/dist/browser.umd.js",
    // use a glob to allow anything in the function-bind 3rd party module
    // '/node_modules/mongoose/dist/**',
  ],
};
