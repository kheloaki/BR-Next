import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }

  return (
    <div className="pt-28 pb-20 px-6 lg:px-16">
      <div className="max-w-5xl mx-auto border border-border bg-[var(--ivory)] p-8 lg:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--graphite)]/70">Admin panel</p>
        <h1 className="mt-3 text-3xl lg:text-4xl font-semibold text-[var(--navy)]">Welcome, {user.firstName ?? user.emailAddresses[0]?.emailAddress}</h1>
        <p className="mt-4 text-[var(--graphite)]/85 leading-relaxed">
          Clerk authentication is active. Supabase and Resend clients are configured and ready to wire into admin actions.
        </p>
      </div>
    </div>
  );
}
