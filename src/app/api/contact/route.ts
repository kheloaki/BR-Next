import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/resend";

export const runtime = "nodejs";

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
  subject?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const subject = body.subject?.trim() || undefined;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email, and message are required" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    return NextResponse.json(
      { error: "Server is missing CONTACT_TO_EMAIL" },
      { status: 500 },
    );
  }

  try {
    const { id } = await sendContactEmail({
      to,
      name,
      email,
      message,
      subject,
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
