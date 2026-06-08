"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export function SignInPanel() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url")?.trim() || "/admin";

  return (
    <div className="min-h-[70vh] pt-28 pb-16 px-6 lg:px-16 flex items-start justify-center">
      <SignIn forceRedirectUrl={redirectUrl} fallbackRedirectUrl="/admin" />
    </div>
  );
}
