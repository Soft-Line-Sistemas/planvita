export type NotificationChannel = "whatsapp" | "email";

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
  assunto?: string | null;
  htmlBody?: string | null;
  textBody?: string | null;
  anexos?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
