import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] pt-28 pb-16 px-6 lg:px-16 flex items-start justify-center">
      <SignUp />
    </div>
  );
}
