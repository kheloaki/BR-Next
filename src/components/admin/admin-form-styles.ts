/** Shared admin UI tokens — scoped via [data-admin] in globals.css */

export const pageWrap = "w-full min-w-0";

/** Full-width module container (sections use AdminInventoryCard for bordered panels). */
export const moduleWrap = "w-full min-w-0";

export const pageHeader =
  "mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between";

/** Module page title — scales down on small screens. */
export const moduleTitle = "text-xl font-semibold tracking-tight text-[var(--navy)] sm:text-2xl";

/** Filter rows above inventory tables — stacks on mobile, grid on tablet, inline on desktop. */
export const filterBarClass =
  "grid grid-cols-1 gap-3 border-b border-border bg-[var(--muted)]/40 px-4 py-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-end xl:gap-2";

export const filterFieldWrap = "min-w-0 w-full xl:w-auto xl:min-w-[10rem]";

/** Horizontal scroll for wide admin tables (use on wrapper or via AdminTableWrap). */
export const tableScrollWrap = "overflow-x-auto touch-pan-x overscroll-x-contain";

export const inputClass =
  "w-full min-h-[36px] rounded-[var(--admin-radius-md)] border border-border bg-white px-3 py-2 text-sm text-[var(--navy)] outline-none transition placeholder:text-[var(--graphite)] focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/10";

export const pillButton =
  "inline-flex items-center gap-1.5 rounded-[var(--admin-radius-pill)] border border-transparent px-2.5 py-1 text-sm text-[var(--navy)] transition hover:bg-[var(--muted)]";

export const badgeSm =
  "rounded-[var(--admin-radius-sm)] border border-border bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--graphite)]";

export const filterInputClass = `${inputClass} mt-1 w-full`;

/** Shared grid for AdminFormCard create forms */
export const formGridClass = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

/** Dense inputs (devis builder lines) */
export const inputClassDense =
  "w-full rounded-[var(--admin-radius-md)] border border-border bg-white px-2 py-1.5 text-sm text-[var(--navy)] outline-none transition placeholder:text-[var(--graphite)] focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/10 tabular-nums";

export const labelClass = "text-xs font-medium text-[var(--graphite)]";

export const btnPrimary =
  "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[var(--admin-radius-pill)] bg-[var(--navy-deep)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--navy)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const btnSecondary =
  "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[var(--admin-radius-pill)] border border-border bg-white px-4 py-2 text-sm font-medium text-[var(--navy)] shadow-sm transition hover:bg-[var(--muted)] active:scale-[0.98] disabled:opacity-50";

/** Compact secondary — card toolbar actions (inventory panels) */
export const btnSecondarySm =
  "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-[var(--admin-radius-pill)] border border-border bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy)] shadow-sm transition hover:bg-[var(--muted)] active:scale-[0.98] disabled:opacity-50";

/** Compact primary — card toolbar highlight actions */
export const btnPrimarySm =
  "inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-[var(--admin-radius-pill)] bg-[var(--navy-deep)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[var(--navy)] active:scale-[0.98] disabled:opacity-50";

export const btnGhost =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[var(--admin-radius-pill)] px-3 py-2 text-sm font-medium text-[var(--navy)] transition hover:bg-[var(--muted)]";

export const btnDanger =
  "inline-flex min-h-[34px] items-center justify-center rounded-[var(--admin-radius-pill)] px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50";

export const btnLinkSuccess =
  "text-sm font-medium text-emerald-700 underline-offset-2 hover:underline";

export const btnLinkDanger =
  "text-sm font-medium text-red-600 underline-offset-2 hover:underline";

/** Segmented category pickers */
export const categorySegmentBtn =
  "flex h-auto min-h-[40px] w-full items-center justify-center whitespace-normal rounded-[var(--admin-radius-md)] px-2 py-2 text-center text-xs font-medium leading-snug transition active:scale-[0.98]";

export const categorySegmentBtnSelected =
  `${categorySegmentBtn} border border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]`;

export const categorySegmentBtnUnselected =
  `${categorySegmentBtn} border border-border bg-white text-[var(--navy)] hover:bg-[var(--muted)]`;

/** Inventory panel table */
export const inventoryTableClass = "w-full min-w-[720px] border-collapse text-sm";

export const tableClass = inventoryTableClass;

export const inventoryThClass =
  "whitespace-nowrap border-b border-border bg-[var(--muted)]/50 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--graphite)]";

export const inventoryThNumClass = `${inventoryThClass} text-right`;

export const thClass = inventoryThClass;

export const inventoryTdClass =
  "max-w-[min(18rem,42vw)] border-b border-border/70 px-3 py-2.5 align-middle text-[var(--navy)]";

export const tdTextClass = `${inventoryTdClass} max-w-[min(20rem,48vw)]`;

export const inventoryTdNumClass = `${inventoryTdClass} text-right tabular-nums`;

export const tdClass = inventoryTdClass;

export const rowHover = "transition-colors hover:bg-[var(--muted)]/40";

export const card =
  "rounded-[var(--admin-radius-lg)] border border-border/80 bg-white shadow-[var(--admin-shadow-card)]";

export const cardMuted =
  "rounded-[var(--admin-radius-lg)] border border-border/60 bg-[var(--muted)]/50";

/** Bordered white panel — tables, detail blocks */
export const panel = `${card} overflow-hidden`;

export const alertBase = "rounded-[var(--admin-radius-lg)] border px-4 py-3 text-sm";

export const alertError = `${alertBase} border-red-200/80 bg-red-50 text-red-800`;

export const alertWarning = `${alertBase} border-amber-200/80 bg-amber-50 text-amber-950`;

export const alertInfo = `${alertBase} border-sky-200/80 bg-sky-50 text-sky-950`;

export const alertSuccess = `${alertBase} border-emerald-200/80 bg-emerald-50 text-emerald-950`;

export const alertNotice = `${alertBase} border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--navy)]`;

export const inlinePanel =
  "rounded-[var(--admin-radius-md)] border border-border/80 bg-white px-3 py-2 text-sm shadow-[var(--admin-shadow)]";

export const statCard =
  "rounded-[var(--admin-radius-md)] border border-border/80 bg-white px-3 py-2.5 shadow-[var(--admin-shadow)]";

export const pageTitle = "text-2xl font-semibold tracking-tight text-[var(--navy)]";

export const pageEyebrow = "text-xs text-[var(--graphite)]";

export const pageSubtitle = "mt-1 text-sm text-[var(--graphite)]";

export const dashboardSectionTitle =
  "mb-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--graphite)]";

export const sectionTitle = "text-base font-semibold tracking-tight text-[var(--navy)]";

/** Uppercase panel title — inventory / fiche projet sections */
export const inventoryPanelTitle = "text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]";

/** Fiche projet — monetary amounts */
export const ficheAmountClass = "font-semibold tabular-nums text-[var(--navy)]";

export const ficheIncomeFooterRow = "border-t border-[var(--fiche-income-border)] bg-[var(--fiche-income-highlight)]";

/** Dashboard / page section label */
export const sectionLabel = "text-sm font-medium text-[var(--navy)]";

/** Inline link style (reference blue) */
export const linkAccent = "text-sm font-medium text-[var(--admin-accent)] hover:underline";
