import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireAdminPage(redirectPath: string) {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
  }
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
  }
  return userId;
}
