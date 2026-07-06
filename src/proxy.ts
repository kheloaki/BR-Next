import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/(fr|en|es)/admin(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-barane-pathname", request.nextUrl.pathname);

    if (isProtectedAdminRoute(request)) {
      await auth.protect();
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
