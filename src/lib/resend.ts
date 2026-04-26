import { buildContactRequestEmail } from "@/lib/email-templates/contact-request";
import { Resend } from "resend";

function getEnv(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getResendClient() {
  return new Resend(getEnv("RESEND_API_KEY"));
}

function formatResendError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Resend error";
  }
}

export async function sendContactEmail(input: {
  to: string;
  name: string;
  email: string;
  message: string;
  subject?: string;
}) {
  const { html, text } = buildContactRequestEmail({
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
  });

  const { data, error } = await getResendClient().emails.send({
    from: getEnv("RESEND_FROM_EMAIL"),
    to: input.to,
    subject: input.subject ?? `Demande de contact — ${input.name}`,
    replyTo: input.email,
    html,
    text,
  });

  if (error) {
    throw new Error(formatResendError(error));
  }
  if (!data?.id) {
    throw new Error("Resend returned no message id");
  }

  return data;
}
