import { auth } from "@clerk/nextjs/server";

/** Ensures an authenticated Clerk session (admin routes are protected in proxy.ts). */
export async function requireAdminPage(_redirectPath: string): Promise<string> {
  const { userId } = await auth.protect();
  return userId;
}
