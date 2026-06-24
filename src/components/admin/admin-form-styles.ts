/** Shared admin UI tokens — use CSS variables from globals.css */

export const pageWrap = "w-full min-w-0";

/** Full-width module container (sections use AdminInventoryCard for bordered panels). */
export const moduleWrap = "w-full min-w-0";

export const pageHeader =
  "border-b border-border pb-4 mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between";

/** Module page title — scales down on small screens. */
export const moduleTitle = "text-xl font-semibold sm:text-2xl text-[var(--navy)] tracking-tight";

/** Filter rows above inventory tables — stacks on mobile, grid on tablet, inline on desktop. */
export const filterBarClass =
  "grid grid-cols-1 gap-3 border-b border-border px-4 py-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-end xl:gap-2";

export const filterFieldWrap = "min-w-0 w-full xl:w-auto xl:min-w-[10rem]";

/** Horizontal scroll for wide admin tables (use on wrapper or via AdminTableWrap). */
export const tableScrollWrap = "overflow-x-auto touch-pan-x overscroll-x-contain";

export const inputClass =
  "w-full min-h-[44px] rounded-lg border border-border bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition placeholder:text-[var(--graphite)]/45 focus:border-[var(--gold)] focus:bg-white focus:ring-2 focus:ring-[var(--gold)]/20";

export const filterInputClass = `${inputClass} mt-1 w-full`;

/** Shared grid for AdminFormCard create forms */
export const formGridClass = "grid sm:grid-cols-2 lg:grid-cols-3 gap-2";

/** Dense inputs (devis builder lines) — same tokens as inputClass, tighter padding */
export const inputClassDense =
  "w-full rounded-lg border border-border bg-[var(--background)] px-2 py-2 text-sm outline-none transition placeholder:text-[var(--graphite)]/45 focus:border-[var(--gold)] focus:bg-white focus:ring-2 focus:ring-[var(--gold)]/20 tabular-nums";

export const labelClass = "text-xs font-semibold uppercase tracking-[0.06em] text-[var(--graphite)]/70";

export const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--gold)] bg-[var(--gold)] px-4 py-2.5 text-sm font-medium text-[var(--navy-deep)] transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

export const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-[var(--navy)] transition hover:bg-[var(--background)] active:scale-[0.98] disabled:opacity-50";

/** Compact secondary — card toolbar actions (inventory panels) */
export const btnSecondarySm =
  "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy)] transition hover:bg-[var(--background)] active:scale-[0.98] disabled:opacity-50";

/** Compact primary — card toolbar highlight actions */
export const btnPrimarySm =
  "inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[var(--gold)] bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[var(--navy-deep)] transition hover:brightness-95 active:scale-[0.98] disabled:opacity-50";

export const btnGhost =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[var(--background)]";

export const btnDanger =
  "inline-flex min-h-[36px] items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50";

export const btnLinkSuccess =
  "text-sm font-medium text-emerald-800 underline-offset-2 hover:underline";

export const btnLinkDanger =
  "text-sm font-medium text-red-700 underline-offset-2 hover:underline";

/** Segmented category pickers (multi-line labels, e.g. Groupe électrogène) */
export const categorySegmentBtn =
  "flex w-full min-h-[44px] h-auto items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-medium leading-snug whitespace-normal transition active:scale-[0.98]";

export const categorySegmentBtnSelected =
  `${categorySegmentBtn} border border-[var(--gold)] bg-[var(--gold)] text-[var(--navy-deep)] hover:brightness-95`;

export const categorySegmentBtnUnselected =
  `${categorySegmentBtn} border border-border bg-white text-[var(--navy)] hover:bg-[var(--background)]`;

/** Inventory panel table (card-head + clean rows) — default for all admin lists */
export const inventoryTableClass = "w-full border-collapse min-w-[720px] text-sm";

export const tableClass = inventoryTableClass;

export const inventoryThClass =
  "text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--graphite)]/70 border-b border-border bg-[var(--background)] px-3 py-2.5 whitespace-nowrap";

export const inventoryThNumClass = `${inventoryThClass} text-right`;

export const thClass = inventoryThClass;

export const inventoryTdClass =
  "border-b border-border/60 px-3 py-2.5 align-middle text-[var(--navy)] max-w-[min(18rem,42vw)]";

/** Text-heavy columns — pair with AdminTruncatedText */
export const tdTextClass = `${inventoryTdClass} max-w-[min(20rem,48vw)]`;

export const inventoryTdNumClass = `${inventoryTdClass} text-right tabular-nums`;

export const tdClass = inventoryTdClass;

export const rowHover = "hover:bg-[var(--background)]/80 transition-colors";

export const card =
  "rounded-xl border border-border bg-white p-4 shadow-sm shadow-black/[0.02]";

export const sectionTitle = "text-lg font-semibold text-[var(--navy)]";

/** Uppercase panel title — inventory / fiche projet sections */
export const inventoryPanelTitle =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--graphite)]/70";

/** Fiche projet — monetary amounts */
export const ficheAmountClass = "font-semibold text-[var(--navy)] tabular-nums";

export const ficheIncomeFooterRow = "border-t border-[var(--fiche-income-border)] bg-[var(--fiche-income-highlight)]";
