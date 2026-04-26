import { MessageCircle } from "lucide-react";

export function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/212661656042"
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp BARANE INVEST"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[var(--gold)] text-[var(--navy-deep)] flex items-center justify-center shadow-[var(--shadow-gold)] hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
