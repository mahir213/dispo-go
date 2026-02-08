import { Locale } from "date-fns";
import { hr } from "date-fns/locale";

// Custom locale based on Croatian but with Serbian/Bosnian month names
const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] as const,
  abbreviated: [
    "jan",
    "feb",
    "mar",
    "apr",
    "maj",
    "jun",
    "jul",
    "avg",
    "sep",
    "okt",
    "nov",
    "dec",
  ] as const,
  wide: [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "juni",
    "juli",
    "august",
    "septembar",
    "oktobar",
    "novembar",
    "decembar",
  ] as const,
};

export const bsLocale: Locale = {
  ...hr,
  localize: {
    ...hr.localize,
    month: (month: number, options?: { width?: string }) => {
      const width = (options?.width || "wide") as "narrow" | "abbreviated" | "wide";
      return monthValues[width]?.[month] || monthValues.wide[month];
    },
  },
};
