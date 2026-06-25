export type NotificationChannel = "whatsapp" | "email";
export type NotificationFlow =
  | "lembrete-3-dias-antes"
  | "cobranca-no-vencimento"
  | "atraso-1-dia"
  | "atraso-7-dias"
  | "pendencia-periodica"
  | "aviso-vencimento"
  | "aviso-pendencia"
  | "suspensao-preventiva"
  | "suspensao"
  | "pos-suspensao";

export interface NotificationRecipient {
  titularId: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  bloqueado: boolean;
  metodo: NotificationChannel;
  totalPendente: number;
  proximoVencimento: string | null;
  quantidadeCobrancas: number;
  cobrancas: Array<{
    contaId: number;
    descricao: string;
    valor: number;
    vencimento: string;
    status: string;
    diasAtraso: number;
  }>;
}

export interface NotificationPanel {
  agendamento: {
    id: number;
    proximaExecucao: string;
    segundosRestantes: number;
    frequenciaMinutos: number;
    metodoPreferencial: NotificationChannel;
    ativo: boolean;
    ultimaExecucao?: string | null;
  };
  totais: {
    elegiveis: number;
    bloqueados: number;
    semContato: number;
    pendencias: number;
  };
  destinatarios: NotificationRecipient[];
}

export interface NotificationFireResult {
  enviados: number;
  ignorados: number;
  falhas: number;
  proximaExecucao: string;
  ultimaExecucao: string;
  detalhes: Array<{
    titularId: number;
    nome: string;
    status: "enviado" | "ignorado" | "falha";
    motivo?: string;
    canal: NotificationChannel;
  }>;
  logId?: string;
}

export type UpdateSchedulePayload = Partial<{
  frequenciaMinutos: number;
  proximaExecucao: string;
  metodoPreferencial: NotificationChannel;
  ativo: boolean;
}>;

export type UpdateRecipientMethodPayload = {
  titularId: number;
  metodo: NotificationChannel;
};

export interface NotificationLogEntry {
  id: number;
  logId?: string | null;
  tenantId: string;
  titularId?: number | null;
  destinatario?: string | null;
  canal: NotificationChannel;
  status: string;
  motivo?: string | null;
  payload?: string | null;
  createdAt: string;
}

export interface NotificationTemplate {
  id: number;
  tenantId: string;
  nome: string;
  canal: NotificationChannel;
  flow?: NotificationFlow | null;
  assunto?: string | null;
  htmlBody?: string | null;
  textBody?: string | null;
  anexos?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappAutomationRule {
  id: number;
  key: string;
  title: string;
  flow: NotificationFlow;
  enabled: boolean;
  priority: number;
  triggerType: string;
  offsetDays: number;
  recurrenceDays?: number | null;
  sendTime: string;
  template?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappAutomationConfig {
  id: number;
  tenantId: string;
  enabled: boolean;
  useFallbackProvider: boolean;
  defaultCountryCode: string;
  timezone: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  sendOnWeekends: boolean;
  minIntervalMinutes: number;
  sessionPath?: string | null;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
  rules: WhatsappAutomationRule[];
}

export interface WhatsappConnectionStatus {
  ready: boolean;
  authenticated?: boolean;
  qrAvailable: boolean;
  qr?: string | null;
  generatedAt?: number | null;
  state: string;
  message?: string;
}

export interface WhatsappDispatchEntry {
  id: number;
  tenantId: string;
  ruleId?: number | null;
  titularId?: number | null;
  contaReceberId?: number | null;
  recipient?: string | null;
  flow?: string | null;
  status: string;
  attemptedAt?: string | null;
  sentAt?: string | null;
  errorMessage?: string | null;
  payloadPreview?: string | null;
  providerRef?: string | null;
  provider: string;
  triggerMode: "AUTOMATIC" | "MANUAL" | "FALLBACK";
  fallbackUsed: boolean;
  createdAt: string;
  rule?: WhatsappAutomationRule | null;
}

export interface WhatsappOverview {
  config: WhatsappAutomationConfig;
  connection: WhatsappConnectionStatus;
  summary: {
    sentToday: number;
    failedToday: number;
    fallbackToday: number;
    activeRules: number;
    minIntervalMinutes: number;
  };
  recent: WhatsappDispatchEntry[];
}

export interface WhatsappQueueItem {
  queuePosition: number | null;
  titularId: number;
  nome: string;
  recipient: string | null;
  flow: NotificationFlow;
  ruleTitle: string;
  status: "QUEUED" | "SKIPPED";
  expectedAt?: string | null;
  delayedByMinutes: number;
  blockedReason?: string;
  totalPendente: number;
  quantidadeCobrancas: number;
}

export interface WhatsappQueuePreview {
  summary: {
    flow: NotificationFlow;
    triggerMode: "AUTOMATIC" | "MANUAL_PREVIEW";
    queued: number;
    skipped: number;
    baseTime: string;
    minIntervalMinutes: number;
  };
  items: WhatsappQueueItem[];
}

export interface WhatsappTestSendResult {
  success: boolean;
  provider?: string;
  fallbackUsed?: boolean;
  referenceId?: string;
  triggerMode?: "AUTOMATIC" | "MANUAL" | "FALLBACK";
  error?: string;
}
