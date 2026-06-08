import { auth } from "@clerk/nextjs/server";

export async function requireAdminPage(redirectPath: string): Promise<string> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: redirectPath }) as never;
  }
  return userId;
}
