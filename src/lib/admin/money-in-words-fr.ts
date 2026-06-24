const UNITS = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

function underHundred(n: number): string {
  if (n < 20) return UNITS[n]!;
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (ten === 7 || ten === 9) {
    const base = ten === 7 ? "soixante" : "quatre-vingt";
    const rest = ten === 7 ? 10 + unit : 10 + unit;
    if (unit === 0 && ten === 9) return "quatre-vingt-dix";
    if (unit === 1 && ten === 7) return "soixante et onze";
    if (unit === 0) return base + (ten === 9 ? "s" : "");
    return `${base}-${UNITS[rest]}`;
  }
  if (unit === 0) return TENS[ten]! + (ten === 8 ? "s" : "");
  if (unit === 1 && ten !== 8) return `${TENS[ten]!} et un`;
  return `${TENS[ten]!}-${UNITS[unit]}`;
}

function underThousand(n: number): string {
  if (n === 0) return "";
  if (n < 100) return underHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredWord =
    hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 && hundreds > 1 ? "s" : ""}`;
  if (rest === 0) return hundredWord;
  return `${hundredWord} ${underHundred(rest)}`;
}

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 1000) return underThousand(n);
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandWord =
      thousands === 1 ? "mille" : `${underThousand(thousands)} mille`.replace("s mille", " mille");
    if (rest === 0) return thousandWord;
    return `${thousandWord} ${underThousand(rest)}`;
  }
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millionWord =
    millions === 1 ? "un million" : `${underThousand(millions)} millions`;
  if (rest === 0) return millionWord;
  return `${millionWord} ${chunkToWords(rest)}`;
}

/** Montant entier en toutes lettres (fr-FR), ex. 287800 → "deux cent quatre-vingt-sept mille huit cents". */
export function moneyInWordsFr(amount: number, suffix = "dirhams HT"): string {
  const value = Math.round(Math.abs(amount));
  if (value === 0) return `zéro ${suffix}`;
  const words = chunkToWords(value);
  const sentence = words.charAt(0).toUpperCase() + words.slice(1);
  return `${sentence} ${suffix}.`;
}
