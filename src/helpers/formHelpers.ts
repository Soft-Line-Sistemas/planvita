export const formatCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      (_, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ""}`,
    );

export const normalizeCpf = (value: string) => value.replace(/\D/g, "");

export const validateCPF = (cpf: string): boolean => {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
};

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(
      /(\d{2})(\d{4})(\d{0,4})/,
      (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`,
    );
  } else {
    return digits.replace(
      /(\d{2})(\d{5})(\d{0,4})/,
      (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`,
    );
  }
};

export const formatWhatsApp = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 10)
    .replace(
      /(\d{2})(\d{4})(\d{0,4})/,
      (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`,
    );

export const getWhatsAppFromPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) return "";
  if (digits.length === 10) return formatWhatsApp(digits);

  // For 11-digit mobile numbers, remove the "9" after DDD when present.
  if (digits[2] === "9") {
    return formatWhatsApp(`${digits.slice(0, 2)}${digits.slice(3, 11)}`);
  }

  return formatWhatsApp(digits.slice(0, 10));
};

export const formatCEP = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{0,3})/, (_, a, b) => `${a}${b ? `-${b}` : ""}`);

export const formatRG = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 10)
    .replace(
      /(\d{2})(\d{3})(\d{3})(\d{0,2})/,
      (_, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ""}`,
    );
