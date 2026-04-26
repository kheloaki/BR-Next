import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] pt-28 pb-16 px-6 lg:px-16 flex items-start justify-center">
      <SignIn />
    </div>
  );
}
