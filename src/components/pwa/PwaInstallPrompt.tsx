"use client";

import { Download, Share, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  canShowIosInstallInstructions,
  isStandaloneDisplay,
  readPwaInstallChoice,
  writePwaInstallChoice,
} from "@/lib/pwa/install-prompt";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PROMPT_DELAY_MS = 2500;

export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"native" | "ios">("native");
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const dismiss = useCallback(() => {
    writePwaInstallChoice("dismissed");
    setOpen(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        writePwaInstallChoice("installed");
        setOpen(false);
      }
    } catch {
      // Browser blocked or cancelled the prompt.
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install prompt may still work on some browsers without SW registration.
    });
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || readPwaInstallChoice()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      writePwaInstallChoice("installed");
      setOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || readPwaInstallChoice()) return;

    const timer = window.setTimeout(() => {
      if (deferredPrompt) {
        setMode("native");
        setOpen(true);
        return;
      }
      if (canShowIosInstallInstructions()) {
        setMode("ios");
        setOpen(true);
      }
    }, PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [deferredPrompt]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-[var(--navy-deep)]/45 animate-in fade-in duration-200"
        onClick={dismiss}
        role="presentation"
      />
      <div
        className="relative w-full max-w-md border border-[var(--navy)]/15 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--navy-deep)] text-[var(--gold)]">
              <Smartphone className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="pwa-install-title" className="font-display text-xl uppercase tracking-wide text-[var(--navy)]">
                Installer l&apos;application
              </h2>
              <p className="mt-1 text-sm text-[var(--graphite)]/80">
                Accédez à BARANE INVEST depuis votre écran d&apos;accueil ou le bureau, comme une application native.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-[var(--graphite)]">
          {mode === "native" ? (
            <p>
              Installez l&apos;application pour un accès rapide, en plein écran, sans barre d&apos;adresse du navigateur.
            </p>
          ) : (
            <ol className="space-y-2">
              <li className="flex items-start gap-2">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
                <span>
                  Appuyez sur <strong>Partager</strong> dans Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
                <span>
                  Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>, puis <strong>Ajouter</strong>.
                </span>
              </li>
            </ol>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="outlineNavy" size="sm" onClick={dismiss}>
            Plus tard
          </Button>
          {mode === "native" ? (
            <Button type="button" variant="gold" size="sm" onClick={install} disabled={installing}>
              {installing ? "Installation…" : "Installer"}
            </Button>
          ) : (
            <Button type="button" variant="gold" size="sm" onClick={dismiss}>
              J&apos;ai compris
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
