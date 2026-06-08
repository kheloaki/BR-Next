import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel } from "@/components/auth/SignInPanel";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à votre espace BARANE INVEST.",
  robots: {
    index: false,
    follow: false,
  },
};

/** Clerk sub-routes (factor-one, SSO, …) */
export default function SignInCatchAllPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] pt-28 pb-16 px-6" />}>
      <SignInPanel />
    </Suspense>
  );
}
