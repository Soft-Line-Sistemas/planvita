const PAYMENT_API_URL =
  process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://localhost:4008/api/v1";
const PAYMENT_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID ??
  "e5efcd00-8302-429f-8fcd-61c883e7d616";
const PAYMENT_TOKEN =
  process.env.NEXT_PUBLIC_PAYMENT_TOKEN ??
  "pk_b1801901-c3b4-4463-bf49-f90e6c51a1ee_fbaa180cf006e46756c238ecdbf3233b309315f944a550eb";
const PAYMENT_TENANT = "bosque";

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "CANCELLED"
  | "FAILED";

export type AsaasBillingType =
  | "PIX"
  | "BOLETO"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "UNDEFINED";

export interface AsaasPayment {
  id: string;
  value: number;
  netValue: number;
  status: AsaasPaymentStatus;
  billingType: AsaasBillingType;
  description?: string;
  dueDate?: string | null;
  createdAt?: string | null;
  customerName?: string;
  customerId?: string;
  externalReference?: string;
  invoiceUrl?: string | null;
  transactionReceiptUrl?: string | null;
  pixQrCodeId?: string | null;
}

export interface AsaasPaymentListParams {
  status?: string;
  customerId?: string;
  externalReference?: string;
  page?: number;
  pageSize?: number;
}

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  metadata?: unknown;
} & Record<string, unknown>;

type RawAsaasPayment = Record<string, unknown>;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const coalesceString = (
  source: RawAsaasPayment | undefined,
  keys: string[],
): string | undefined => {
  if (!source) return undefined;
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return undefined;
};

const coalesceNumber = (
  source: RawAsaasPayment | undefined,
  keys: string[],
  fallback = 0,
): number => {
  if (source) {
    for (const key of keys) {
      const value = asNumber(source[key]);
      if (typeof value === "number") return value;
    }
  }
  return fallback;
};

const normalizeStatus = (status?: string | null): AsaasPaymentStatus => {
  const value = (status ?? "PENDING").toUpperCase();
  const allowed: AsaasPaymentStatus[] = [
    "PENDING",
    "RECEIVED",
    "CONFIRMED",
    "OVERDUE",
    "REFUNDED",
    "CANCELLED",
    "FAILED",
  ];
  return allowed.includes(value as AsaasPaymentStatus)
    ? (value as AsaasPaymentStatus)
    : "PENDING";
};

const normalizeBillingType = (type?: string | null): AsaasBillingType => {
  const value = (type ?? "UNDEFINED").toUpperCase();
  const allowed: AsaasBillingType[] = [
    "PIX",
    "BOLETO",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "UNDEFINED",
  ];
  return allowed.includes(value as AsaasBillingType)
    ? (value as AsaasBillingType)
    : "UNDEFINED";
};

const toAsaasPayment = (raw: RawAsaasPayment): AsaasPayment => {
  const dueDate =
    coalesceString(raw, ["dueDate", "due_date", "paymentDate", "createdAt"]) ??
    null;
  const createdAt =
    coalesceString(raw, ["dateCreated", "created_at", "createdAt"]) ?? null;
  const customer =
    (raw.customer && typeof raw.customer === "object"
      ? (raw.customer as RawAsaasPayment)
      : undefined) ?? undefined;

  return {
    id: String(raw.id ?? raw.paymentId ?? crypto.randomUUID()),
    value: coalesceNumber(raw, ["value", "amount"], 0),
    netValue: coalesceNumber(raw, ["netValue", "netAmount", "value"], 0),
    status: normalizeStatus(
      (asString(raw.status) ?? asString(raw.paymentStatus)) || undefined,
    ),
    billingType: normalizeBillingType(
      (asString(raw.billingType) ?? asString(raw.method)) || undefined,
    ),
    description:
      coalesceString(raw, ["description", "notes", "observations"]) ?? "",
    dueDate,
    createdAt,
    customerName:
      getStringField(customer, "name") ??
      coalesceString(raw, ["customerName", "customer", "payerName"]) ??
      "Cliente",
    customerId:
      getStringField(customer, "id") ??
      coalesceString(raw, ["customerId", "customer"]) ??
      undefined,
    externalReference:
      coalesceString(raw, ["externalReference", "reference", "referenceId"]) ??
      "",
    invoiceUrl:
      coalesceString(raw, [
        "invoiceUrl",
        "bankSlipUrl",
        "bankSlipPdf",
        "checkoutUrl",
      ]) ?? null,
    transactionReceiptUrl:
      coalesceString(raw, [
        "transactionReceiptUrl",
        "cardTransactionUrl",
        "receiptUrl",
      ]) ?? null,
    pixQrCodeId:
      coalesceString(raw, ["pixQrCodeId", "pixQrCode", "pixQrCodeUrl"]) ?? null,
  };
};

const getStringField = (
  source: RawAsaasPayment | undefined,
  key: string,
): string | undefined => {
  if (!source) return undefined;
  return asString(source[key]);
};

const extractItems = (payload: unknown): RawAsaasPayment[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as RawAsaasPayment[];
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const keys = ["data", "items", "results"];
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as RawAsaasPayment[];
      }
    }
  }
  return [];
};

const assertEnv = () => {
  if (!PAYMENT_API_URL) {
    throw new Error("NEXT_PUBLIC_PAYMENT_API_URL não configurado.");
  }
  if (!PAYMENT_CLIENT_ID || !PAYMENT_TOKEN) {
    throw new Error(
      "Credenciais da integração de pagamentos não configuradas no cliente.",
    );
  }
};

const requestPayments = async (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
  assertEnv();
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${PAYMENT_API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYMENT_TOKEN}`,
      "x-client-id": PAYMENT_CLIENT_ID,
      "x-tenant": PAYMENT_TENANT,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      errorPayload?.error?.message ??
        errorPayload?.message ??
        "Não foi possível consultar o provedor Asaas.",
    );
  }

  return (await response.json()) as ApiResponse<unknown>;
};

export const listAsaasPayments = async (
  params?: AsaasPaymentListParams,
): Promise<AsaasPayment[]> => {
  const response = await requestPayments("/providers/asaas/payments", {
    ...params,
    status:
      params?.status && params.status !== "all" ? params.status : undefined,
  });

  const payload = response.data ?? response;
  const items = extractItems(payload);
  return items.map((item) => toAsaasPayment(item));
};
