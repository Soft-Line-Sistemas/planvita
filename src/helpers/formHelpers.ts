export const formatCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      (_, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ""}`,
    );

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
      /(\d{2})(\d{3})(\d{3})(\d{0,1})/,
      (_, a, b, c, d) => `${a}.${b}.${c}${d ? `-${d}` : ""}`,
    );
