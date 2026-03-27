type DateLike = string | Date | null | undefined;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MIDNIGHT_UTC_REGEX = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?Z$/i;

const isValidYmd = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const parseYmd = (
  value: string,
): { year: number; month: number; day: number } | null => {
  const match = value.match(DATE_ONLY_REGEX);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidYmd(year, month, day)) return null;
  return { year, month, day };
};

const getBirthDateParts = (value: DateLike) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  const dateOnly = parseYmd(normalized);
  if (dateOnly) return dateOnly;

  const isoPrefix = normalized.slice(0, 10);
  const prefixDate = parseYmd(isoPrefix);
  if (prefixDate) return prefixDate;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
};

export const formatDatePtBr = (
  value: DateLike,
  options?: Intl.DateTimeFormatOptions,
): string => {
  if (!value) return "";

  const formatter = (date: Date, useUtc = false) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...options,
      ...(useUtc ? { timeZone: "UTC" } : {}),
    }).format(date);

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatter(value);
  }

  const normalized = String(value).trim();
  if (!normalized) return "";

  const dateOnly = parseYmd(normalized);
  if (dateOnly) {
    const date = new Date(
      Date.UTC(dateOnly.year, dateOnly.month - 1, dateOnly.day),
    );
    return formatter(date, true);
  }

  const isIsoMidnightUtc = ISO_MIDNIGHT_UTC_REGEX.test(normalized);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return formatter(parsed, isIsoMidnightUtc);
};

export const toISODateSafe = (value?: string | null): string => {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";

  const dateOnly = parseYmd(normalized);
  if (dateOnly) return normalized;

  const isoPrefix = normalized.slice(0, 10);
  if (parseYmd(isoPrefix)) return isoPrefix;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

export const calculateAgeFromBirthDate = (value: DateLike): number | null => {
  const birth = getBirthDateParts(value);
  if (!birth) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.year;

  if (
    today.getMonth() + 1 < birth.month ||
    (today.getMonth() + 1 === birth.month && today.getDate() < birth.day)
  ) {
    age -= 1;
  }

  return age;
};
