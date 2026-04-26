"use client";

import type { LucideIcon } from "lucide-react";
import { Phone, Mail, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type ContactRow = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

export function ContactCTA({ locale = "fr" }: { locale?: Locale }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    sector: "",
    need: "",
  });
  const t =
    locale === "en"
      ? {
          eyebrow: "Let's discuss your project",
          intro:
            "Need a quote, technical brief or complex sourcing? Our teams reply within 24 business hours.",
          titleA: "Tell us about",
          titleB: "your need.",
          formTitle: "Quote request",
          thankYou: "Thank you.",
          sent: "Request sent. Our teams will contact you within 24 business hours.",
          error: "Unable to send your request right now. Please try again.",
          fullName: "Full name *",
          company: "Company *",
          email: "Email *",
          phone: "Phone",
          sector: "Sector (mining, construction, industry...)",
          need: "Describe your need: products, volumes, deadlines, delivery location...",
          submit: "Send request",
          sending: "Sending...",
          labels: { phone: "Phone", whatsapp: "WhatsApp Business", email: "Business email", hq: "Head office" },
          city: "Agadir · Morocco",
        }
      : locale === "es"
        ? {
            eyebrow: "Hablemos de su proyecto",
            intro:
              "Necesita una cotizacion, un pliego tecnico o un sourcing complejo? Nuestro equipo responde en 24h laborables.",
            titleA: "Cuéntenos",
            titleB: "su necesidad.",
            formTitle: "Solicitud de cotizacion",
            thankYou: "Gracias.",
            sent: "Solicitud enviada. Nuestro equipo le contactara en 24h laborables.",
            error: "No se pudo enviar la solicitud. Intente de nuevo.",
            fullName: "Nombre completo *",
            company: "Empresa *",
            email: "Email *",
            phone: "Telefono",
            sector: "Sector (mineria, construccion, industria...)",
            need: "Describa su necesidad: productos, volumenes, plazos, lugar de entrega...",
            submit: "Enviar solicitud",
            sending: "Enviando...",
            labels: { phone: "Telefono", whatsapp: "WhatsApp Business", email: "Email comercial", hq: "Sede" },
            city: "Agadir · Marruecos",
          }
      : {
          eyebrow: "Parlons projet",
          intro:
            "Une demande de devis, un cahier des charges, un sourcing complexe ? Nos équipes répondent sous 24h ouvrées.",
          titleA: "Parlez-nous de",
          titleB: "votre besoin.",
          formTitle: "Demande de devis",
          thankYou: "Merci.",
          sent: "Demande envoyée. Nos équipes vous recontactent sous 24h ouvrées.",
          error: "Impossible d'envoyer la demande pour le moment. Réessayez.",
          fullName: "Nom complet *",
          company: "Société *",
          email: "Email *",
          phone: "Téléphone",
          sector: "Secteur (mines, BTP, industrie...)",
          need: "Décrivez votre besoin : produits, volumes, délais, lieu de livraison...",
          submit: "Envoyer la demande",
          sending: "Envoi...",
          labels: { phone: "Téléphone", whatsapp: "WhatsApp Business", email: "Email commercial", hq: "Siège social" },
          city: "Agadir · Maroc",
        };
  const contactRows: ContactRow[] = [
    { icon: Phone, label: t.labels.phone, value: "+212 661 65 60 42", href: "tel:+212661656042" },
    { icon: MessageCircle, label: t.labels.whatsapp, value: "+212 661 65 60 42", href: "https://wa.me/212661656042" },
    { icon: Mail, label: t.labels.email, value: "contact@baraneinvest.com", href: "mailto:contact@baraneinvest.com" },
    { icon: MapPin, label: t.labels.hq, value: t.city },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          subject:
            locale === "en"
              ? "Quote request"
              : locale === "es"
                ? "Solicitud de cotizacion"
                : "Demande de devis",
          message: [
            `Company: ${form.company}`,
            `Phone: ${form.phone || "-"}`,
            `Sector: ${form.sector || "-"}`,
            "",
            form.need,
          ].join("\n"),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        const serverMessage = payload?.details || payload?.error;
        throw new Error(serverMessage || "Request failed");
      }

      setSubmitted(true);
      setForm({
        fullName: "",
        company: "",
        email: "",
        phone: "",
        sector: "",
        need: "",
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(raw ? `${t.error} (${raw})` : t.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="relative bg-[var(--navy-deep)] text-[var(--ivory)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-topo opacity-[0.07] mix-blend-screen" />

      <div className="relative px-6 lg:px-16 pt-32 lg:pt-40 pb-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
              </div>
              <p className="mt-8 text-[var(--ivory)]/70 leading-relaxed">
                {t.intro}
              </p>
            </div>
            <div className="lg:col-span-9">
              <h2 className="display-xl text-[12vw] lg:text-[8vw] xl:text-[10rem] text-[var(--ivory)] leading-[0.85]">
                {t.titleA}
                <br />
                <span className="text-[var(--gold)]">{t.titleB}</span>
              </h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-0">
            <div className="lg:col-span-5 border-t border-[var(--gold)]/20">
              {contactRows.map(({ icon: Icon, label, value, href }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center justify-between py-6 border-b border-[var(--gold)]/20 group hover:pl-4 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <Icon className="h-5 w-5 text-[var(--gold)]" />
                      <div>
                        <div className="eyebrow text-[var(--ivory)]/50">{label}</div>
                        <div className="mt-1 font-display text-2xl text-[var(--ivory)] group-hover:text-[var(--gold)] transition-colors">
                          {value}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--ivory)]/30 group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all" />
                  </a>
                ) : (
                  <div
                    key={label}
                    className="flex items-center justify-between py-6 border-b border-[var(--gold)]/20"
                  >
                    <div className="flex items-center gap-5">
                      <Icon className="h-5 w-5 text-[var(--gold)]" />
                      <div>
                        <div className="eyebrow text-[var(--ivory)]/50">{label}</div>
                        <div className="mt-1 font-display text-2xl text-[var(--ivory)]">{value}</div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="lg:col-span-1" />

            <div className="lg:col-span-6 mt-16 lg:mt-0">
              <form
                onSubmit={handleSubmit}
                className="bg-[var(--ivory)] text-[var(--navy)] p-8 lg:p-12 relative"
              >
                <div className="flex items-baseline justify-between mb-8">
                  <h3 className="font-display text-3xl lg:text-4xl text-[var(--navy)] leading-none">
                    {t.formTitle}
                  </h3>
                  <span className="num-marker">→</span>
                </div>

                {submitted ? (
                  <div className="py-16 text-center">
                    <div className="font-display text-5xl text-[var(--gold)] mb-4">{t.thankYou}</div>
                    <p className="text-[var(--graphite)]">
                      {t.sent}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {error ? (
                      <p className="text-sm text-red-700 bg-red-100 border border-red-200 px-3 py-2">
                        {error}
                      </p>
                    ) : null}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        value={form.fullName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder={t.fullName}
                        required
                        className="h-14 bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                      />
                      <Input
                        value={form.company}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            company: e.target.value,
                          }))
                        }
                        placeholder={t.company}
                        required
                        className="h-14 bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder={t.email}
                        required
                        className="h-14 bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                      />
                      <Input
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder={t.phone}
                        className="h-14 bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                      />
                    </div>
                    <Input
                      value={form.sector}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sector: e.target.value,
                        }))
                      }
                      placeholder={t.sector}
                      className="h-14 bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                    />
                    <Textarea
                      value={form.need}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          need: e.target.value,
                        }))
                      }
                      placeholder={t.need}
                      rows={4}
                      required
                      className="bg-transparent border-0 border-b border-[var(--navy)]/30 rounded-none px-0 pt-4 resize-none focus-visible:ring-0 focus-visible:border-[var(--gold)] focus-visible:border-b-2 placeholder:text-[var(--navy)]/50"
                    />
                    <Button
                      variant="navy"
                      size="xl"
                      type="submit"
                      className="w-full mt-6"
                      disabled={submitting}
                    >
                      {submitting ? t.sending : t.submit} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
