"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Send,
  RefreshCw,
  Clock3,
  ShieldOff,
  Smartphone,
  Mail,
  PauseCircle,
  PlayCircle,
  QrCode,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePainelNotificacoesRecorrentes } from "@/hooks/queries/usePainelNotificacoesRecorrentes";
import {
  useAtualizarAgendamentoNotificacao,
  useAtualizarWhatsappConfig,
  useDispararNotificacoesRecorrentes,
  useDesconectarWhatsapp,
  useEnviarTesteWhatsapp,
  useToggleBloqueioNotificacao,
  useAtualizarMetodoNotificacao,
  useCriarTemplate,
  useAtualizarTemplate,
  useRemoverTemplate,
} from "@/hooks/mutations/useNotificacoesRecorrentesMutations";
import { useLogsNotificacoes } from "@/hooks/queries/useLogsNotificacoes";
import { useTemplatesNotificacoes } from "@/hooks/queries/useTemplatesNotificacoes";
import { useWhatsappOverview } from "@/hooks/queries/useWhatsappOverview";
import { useWhatsappQueue } from "@/hooks/queries/useWhatsappQueue";
import {
  NotificationChannel,
  NotificationTemplate,
  NotificationFlow,
  WhatsappDispatchEntry,
} from "@/types/Notification";
import getTenantFromHost from "@/utils/getTenantFromHost";
import { fetchWhatsappQr } from "@/services/financeiro/notificacoes-recorrentes.service";
import QRCode from "qrcode";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "—";

const pad = (value: number) => String(value).padStart(2, "0");

const fluxoOptions: Record<
  NotificationFlow,
  { titulo: string; descricao: string }
> = {
  "lembrete-3-dias-antes": {
    titulo: "Lembrete 3 dias antes",
    descricao:
      "Envia um lembrete único exatamente 3 dias antes do vencimento da cobrança.",
  },
  "cobranca-no-vencimento": {
    titulo: "Cobrança no vencimento",
    descricao: "Envia uma cobrança única no dia exato do vencimento.",
  },
  "atraso-1-dia": {
    titulo: "Atraso 1 dia",
    descricao:
      "Envia um aviso único quando a cobrança completa 1 dia de atraso.",
  },
  "atraso-7-dias": {
    titulo: "Atraso 7 dias",
    descricao:
      "Envia um aviso único quando a cobrança completa 7 dias de atraso.",
  },
  "pendencia-periodica": {
    titulo: "Repetição de pendência",
    descricao:
      "Reenvia avisos de cobrança enquanto houver pendências, seguindo a regra de repetição.",
  },
  "aviso-vencimento": {
    titulo: "Aviso de vencimento",
    descricao:
      'Envio único antes do vencimento conforme a regra "Dias para aviso de vencimento".',
  },
  "aviso-pendencia": {
    titulo: "Primeiro aviso de pendência",
    descricao:
      'Envio único após atraso usando a regra "Dias para aviso de pendência".',
  },
  "suspensao-preventiva": {
    titulo: "Suspensão preventiva",
    descricao:
      "Aviso único para clientes próximos da suspensão preventiva, seguindo a regra configurada.",
  },
  suspensao: {
    titulo: "Suspensão",
    descricao:
      "Envio único quando a cobrança atinge a regra de dias para suspensão.",
  },
  "pos-suspensao": {
    titulo: "Pós-suspensão",
    descricao:
      "Envio único após o prazo pós-suspensão para orientar regularização e reativação.",
  },
  "reajuste-anual": {
    titulo: "Reajuste anual",
    descricao: "Aviso único na data anual de reajuste do contrato.",
  },
  "renovacao-automatica": {
    titulo: "Renovação automática",
    descricao: "Aviso único na renovação do contrato após 60 meses.",
  },
};

const flowLabel = (flow?: NotificationFlow | null) =>
  flow && fluxoOptions[flow] ? fluxoOptions[flow].titulo : "Todos os fluxos";

const flowLabelFlexible = (flow?: string | null) =>
  flow && flow in fluxoOptions
    ? fluxoOptions[flow as NotificationFlow].titulo
    : flow || "Sem fluxo";

const painelFlowOrder: NotificationFlow[] = [
  "aviso-vencimento",
  "pendencia-periodica",
  "suspensao-preventiva",
  "suspensao",
  "pos-suspensao",
  "reajuste-anual",
  "renovacao-automatica",
];

export default function NotificacoesRecorrentesPage() {
  const [tipoAviso, setTipoAviso] = useState<NotificationFlow>(
    "lembrete-3-dias-antes",
  );
  const { data, isLoading, isError, refetch } =
    usePainelNotificacoesRecorrentes(tipoAviso);
  const disparar = useDispararNotificacoesRecorrentes();
  const atualizarAgendamento = useAtualizarAgendamentoNotificacao();
  const toggleBloqueio = useToggleBloqueioNotificacao();
  const atualizarMetodo = useAtualizarMetodoNotificacao();
  const {
    data: logs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useLogsNotificacoes(50, tipoAviso);
  const { data: templates, refetch: refetchTemplates } =
    useTemplatesNotificacoes(tipoAviso);
  const criarTemplate = useCriarTemplate();
  const atualizarTemplate = useAtualizarTemplate();
  const removerTemplate = useRemoverTemplate();
  const atualizarWhatsappConfig = useAtualizarWhatsappConfig();
  const desconectarWhatsapp = useDesconectarWhatsapp();
  const enviarTesteWhatsapp = useEnviarTesteWhatsapp();
  const {
    data: whatsappOverview,
    isLoading: isLoadingWhatsapp,
    refetch: refetchWhatsapp,
  } = useWhatsappOverview();
  const {
    data: whatsappQueue,
    isLoading: isLoadingWhatsappQueue,
    refetch: refetchWhatsappQueue,
  } = useWhatsappQueue(tipoAviso);
  const tenantSlug =
    typeof window !== "undefined" ? getTenantFromHost() : "lider";
  const [abaAtiva, setAbaAtiva] = useState("operacao");

  const buildDefaultTemplate = useCallback(
    (canal: NotificationChannel, flow: NotificationFlow) => {
      const tenant = (tenantSlug || "lider").toLowerCase();
      const nomeEmpresa =
        tenant === "bosque"
          ? "PLANO FAMILIAR CAMPO DO BOSQUE LTDA"
          : tenant === "pax"
            ? "PAX PLANVITA"
            : "LIDER PLANVITA";

      let assunto = "";
      let html = "";
      let text = "";

      if (flow === "lembrete-3-dias-antes") {
        assunto = "Lembrete 3 dias antes do vencimento";
        const mensagemCobranca = [
          "Olá, {{nomeCliente}}",
          "Passando para lembrar que sua cobrança de {{valor}} vence em {{vencimento}}.",
          "Descrição: {{descricao}}.",
          "Pague ou consulte em: {{linkCobranca}}",
        ].join("\n");
        if (canal === "email") {
          html = mensagemCobranca.replace(/\n/g, "<br />");
          text = mensagemCobranca;
        } else {
          text = mensagemCobranca;
        }
      } else if (flow === "cobranca-no-vencimento") {
        assunto = "Cobrança no vencimento";
        const mensagemCobranca = [
          "Olá, {{nomeCliente}}",
          "Sua cobrança de {{valor}} vence hoje ({{vencimento}}).",
          "Descrição: {{descricao}}.",
          "Pague ou consulte em: {{linkCobranca}}",
        ].join("\n");
        if (canal === "email") {
          html = mensagemCobranca.replace(/\n/g, "<br />");
          text = mensagemCobranca;
        } else {
          text = mensagemCobranca;
        }
      } else if (flow === "atraso-1-dia") {
        assunto = "Cobrança com 1 dia de atraso";
        const mensagemCobranca = [
          "Olá, {{nomeCliente}}",
          "Identificamos que sua cobrança de {{valor}} está com 1 dia de atraso desde {{vencimento}}.",
          "Descrição: {{descricao}}.",
          "Regularize em: {{linkCobranca}}",
        ].join("\n");
        if (canal === "email") {
          html = mensagemCobranca.replace(/\n/g, "<br />");
          text = mensagemCobranca;
        } else {
          text = mensagemCobranca;
        }
      } else if (flow === "atraso-7-dias") {
        assunto = "Cobrança com 7 dias de atraso";
        const mensagemCobranca = [
          "Olá, {{nomeCliente}}",
          "Sua cobrança de {{valor}} está com 7 dias de atraso desde {{vencimento}}.",
          "Descrição: {{descricao}}.",
          "Regularize em: {{linkCobranca}}",
        ].join("\n");
        if (canal === "email") {
          html = mensagemCobranca.replace(/\n/g, "<br />");
          text = mensagemCobranca;
        } else {
          text = mensagemCobranca;
        }
      } else if (flow === "pendencia-periodica") {
        assunto = "Lembrete de pendência financeira";
        const mensagemCobranca = [
          "Olá, {{nomeCliente}}",
          "Sua cobrança gerada por {{nomeEmpresa}} no valor de {{valor}} vence em {{vencimento}}.",
          "Descrição: {{descricao}}.",
          "Visualize/regularize em: {{linkCobranca}}",
        ].join("\n");
        if (canal === "email") {
          html = mensagemCobranca.replace(/\n/g, "<br />");
          text = mensagemCobranca;
        } else {
          text = mensagemCobranca;
        }
      } else if (flow === "aviso-vencimento") {
        assunto = "Aviso de vencimento próximo";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} lembra: Sua fatura vence em breve.</p>`;
          text = `Olá, ${nomeEmpresa} lembra: Sua fatura vence em breve.`;
        } else {
          text = `Olá, ${nomeEmpresa} lembra: Sua fatura vence em breve.`;
        }
      } else if (flow === "aviso-pendencia") {
        assunto = "Aviso de atraso no pagamento";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} informa: Não identificamos o pagamento da sua fatura.</p>`;
          text = `Olá, ${nomeEmpresa} informa: Não identificamos o pagamento da sua fatura.`;
        } else {
          text = `Olá, ${nomeEmpresa} informa: Não identificamos o pagamento da sua fatura.`;
        }
      } else if (flow === "suspensao-preventiva") {
        assunto = "Aviso de suspensão preventiva";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} informa: Seu plano está sujeito a suspensão preventiva.</p>`;
          text = `Olá, ${nomeEmpresa} informa: Seu plano está sujeito a suspensão preventiva.`;
        } else {
          text = `Olá, ${nomeEmpresa} informa: Seu plano está sujeito a suspensão preventiva.`;
        }
      } else if (flow === "suspensao") {
        assunto = "Aviso de suspensão do plano";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} informa: Seu plano está suspenso por pendência financeira.</p>`;
          text = `Olá, ${nomeEmpresa} informa: Seu plano está suspenso por pendência financeira.`;
        } else {
          text = `Olá, ${nomeEmpresa} informa: Seu plano está suspenso por pendência financeira.`;
        }
      } else if (flow === "pos-suspensao") {
        assunto = "Plano suspenso: regularize para reativação";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} informa: Seu plano permanece suspenso. Regularize para reativação.</p>`;
          text = `Olá, ${nomeEmpresa} informa: Seu plano permanece suspenso. Regularize para reativação.`;
        } else {
          text = `Olá, ${nomeEmpresa} informa: Seu plano permanece suspenso. Regularize para reativação.`;
        }
      }

      return { html, text, assunto };
    },
    [tenantSlug],
  );

  const [contadorSegundos, setContadorSegundos] = useState(0);
  const [frequenciaMinutos, setFrequenciaMinutos] = useState(1440);
  const [metodo, setMetodo] = useState<NotificationChannel>("whatsapp");
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(true);
  const [novoTemplate, setNovoTemplate] = useState({
    nome: "Cobrança pendente",
    canal: "email",
    assunto: "Cobrança pendente",
    htmlBody: "",
    textBody: "",
    isDefault: false,
    flow: tipoAviso as NotificationFlow,
  });
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState<
    number | null
  >(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappFallbackEnabled, setWhatsappFallbackEnabled] = useState(true);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("55");
  const [whatsappTimezone, setWhatsappTimezone] = useState("America/Bahia");
  const [whatsappQuietStart, setWhatsappQuietStart] = useState("");
  const [whatsappQuietEnd, setWhatsappQuietEnd] = useState("");
  const [whatsappSendOnWeekends, setWhatsappSendOnWeekends] = useState(false);
  const [whatsappMinIntervalMinutes, setWhatsappMinIntervalMinutes] =
    useState(240);
  const [whatsappRulesState, setWhatsappRulesState] = useState<
    Array<{
      id: number;
      title: string;
      flow: NotificationFlow;
      enabled: boolean;
    }>
  >([]);
  const [qrImageSrc, setQrImageSrc] = useState("");
  const [qrStatusMessage, setQrStatusMessage] = useState<string | null>(null);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [whatsappTestPhone, setWhatsappTestPhone] = useState("");
  const [whatsappTestMessage, setWhatsappTestMessage] = useState(
    "Mensagem de teste do WhatsApp próprio do Campo do Bosque.",
  );
  const logsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data?.agendamento && tipoAviso === "pendencia-periodica") {
      setContadorSegundos(
        data.agendamento.ativo ? data.agendamento.segundosRestantes : 0,
      );
      setFrequenciaMinutos(data.agendamento.frequenciaMinutos);
      setMetodo(data.agendamento.metodoPreferencial);
      setAgendamentoAtivo(data.agendamento.ativo);
    } else {
      setContadorSegundos(0);
    }
  }, [data, tipoAviso]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!whatsappOverview?.config) return;
    setWhatsappEnabled(whatsappOverview.config.enabled);
    setWhatsappFallbackEnabled(whatsappOverview.config.useFallbackProvider);
    setWhatsappCountryCode(whatsappOverview.config.defaultCountryCode || "55");
    setWhatsappTimezone(whatsappOverview.config.timezone || "America/Bahia");
    setWhatsappQuietStart(whatsappOverview.config.quietHoursStart || "");
    setWhatsappQuietEnd(whatsappOverview.config.quietHoursEnd || "");
    setWhatsappSendOnWeekends(whatsappOverview.config.sendOnWeekends);
    setWhatsappMinIntervalMinutes(
      whatsappOverview.config.minIntervalMinutes || 240,
    );
    setWhatsappRulesState(
      whatsappOverview.config.rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        flow: rule.flow,
        enabled: rule.enabled,
      })),
    );
  }, [whatsappOverview?.config]);

  useEffect(() => {
    const qr = whatsappOverview?.connection?.qr;
    if (!qr) {
      setQrImageSrc("");
      return;
    }

    QRCode.toDataURL(qr, { width: 320, margin: 2 })
      .then(setQrImageSrc)
      .catch(() => setQrImageSrc(""));
  }, [whatsappOverview?.connection?.qr]);

  useEffect(() => {
    if (!agendamentoAtivo || tipoAviso !== "pendencia-periodica") return;
    const timer = setInterval(() => {
      setContadorSegundos((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [agendamentoAtivo, tipoAviso]);

  const fluxoSelecionado = useMemo(() => fluxoOptions[tipoAviso], [tipoAviso]);
  const isPeriodic = tipoAviso === "pendencia-periodica";

  useEffect(() => {
    setNovoTemplate((prev) => {
      const base = buildDefaultTemplate(
        prev.canal as NotificationChannel,
        tipoAviso,
      );
      return {
        ...prev,
        flow: tipoAviso,
        assunto: base.assunto ?? prev.assunto,
      };
    });
  }, [tipoAviso, buildDefaultTemplate]);

  const destinatarios = useMemo(
    () => data?.destinatarios ?? [],
    [data?.destinatarios],
  );

  const progresso =
    agendamentoAtivo &&
    tipoAviso === "pendencia-periodica" &&
    frequenciaMinutos > 0
      ? Math.min(
          100,
          Math.max(
            0,
            100 -
              (contadorSegundos / Math.max(frequenciaMinutos * 60, 1)) * 100,
          ),
        )
      : 0;

  const resumoContatos = useMemo(() => {
    const elegiveis = destinatarios.filter(
      (d) => !d.bloqueado && (d.telefone || d.email),
    );
    const whatsapp = elegiveis.filter((d) => d.metodo === "whatsapp").length;
    const email = elegiveis.length - whatsapp;
    return { elegiveis: elegiveis.length, whatsapp, email };
  }, [destinatarios]);

  const handleSalvarAgendamento = () => {
    atualizarAgendamento.mutate({
      frequenciaMinutos,
      metodoPreferencial: metodo,
      ativo: agendamentoAtivo,
    });
  };

  const handleToggleBloqueio = (titularId: number, bloqueado: boolean) => {
    toggleBloqueio.mutate({ titularId, bloqueado, tipo: tipoAviso });
  };

  const handleAlterarMetodo = (
    titularId: number,
    metodo: NotificationChannel,
  ) => {
    atualizarMetodo.mutate({ titularId, metodo, tipo: tipoAviso });
  };

  const handleDisparar = () => {
    disparar.mutate(tipoAviso, {
      onSuccess: () => {
        refetch();
        refetchLogs();
      },
    });
  };

  const aplicarModeloPadrao = () => {
    const base = buildDefaultTemplate(
      novoTemplate.canal as NotificationChannel,
      tipoAviso,
    );
    setNovoTemplate((prev) => ({
      ...prev,
      htmlBody: base.html,
      textBody: base.text,
      assunto: base.assunto ?? prev.assunto,
    }));
    setTemplateSelecionadoId(null);
  };

  const handleSalvarTemplate = () => {
    const payload = {
      ...novoTemplate,
      canal: novoTemplate.canal as NotificationChannel,
      flow: tipoAviso,
    };
    criarTemplate.mutate(payload, {
      onSuccess: () => {
        refetchTemplates();
      },
    });
  };

  const handleDefinirDefault = (id: number, canal: NotificationChannel) => {
    atualizarTemplate.mutate(
      { id, payload: { isDefault: true, canal, flow: tipoAviso } },
      { onSuccess: () => refetchTemplates() },
    );
  };

  const handleRemoverTemplate = (id: number) => {
    removerTemplate.mutate(id, { onSuccess: () => refetchTemplates() });
  };

  const handleVisualizarTemplate = (tpl: NotificationTemplate) => {
    setTemplateSelecionadoId(tpl.id);
    setNovoTemplate({
      nome: tpl.nome,
      canal: tpl.canal,
      assunto: tpl.assunto ?? "",
      htmlBody: tpl.htmlBody ?? "",
      textBody: tpl.textBody ?? "",
      isDefault: tpl.isDefault,
      flow: (tpl.flow as NotificationFlow) ?? tipoAviso,
    });
  };

  const segundos = contadorSegundos % 60;
  const minutos = Math.floor(contadorSegundos / 60) % 60;
  const horas = Math.floor(contadorSegundos / 3600);
  const whatsappRecentes = whatsappOverview?.recent ?? [];

  const handleSalvarWhatsappConfig = () => {
    atualizarWhatsappConfig.mutate({
      enabled: whatsappEnabled,
      useFallbackProvider: whatsappFallbackEnabled,
      defaultCountryCode: whatsappCountryCode,
      timezone: whatsappTimezone,
      quietHoursStart: whatsappQuietStart || null,
      quietHoursEnd: whatsappQuietEnd || null,
      sendOnWeekends: whatsappSendOnWeekends,
      minIntervalMinutes: whatsappMinIntervalMinutes,
      rules: whatsappRulesState.map((rule) => ({
        id: rule.id,
        enabled: rule.enabled,
        title: rule.title,
      })),
    });
  };

  const handleRefreshQr = async () => {
    try {
      setIsRefreshingQr(true);
      const status = await fetchWhatsappQr(true);
      setQrStatusMessage(status.message ?? null);
      if (status.qr) {
        setQrImageSrc(
          await QRCode.toDataURL(status.qr, { width: 320, margin: 2 }),
        );
      }
      await refetchWhatsapp();
    } finally {
      setIsRefreshingQr(false);
    }
  };

  const handleDisconnectWhatsapp = () => {
    desconectarWhatsapp.mutate(undefined, {
      onSuccess: async () => {
        setQrStatusMessage(
          "Sessão desconectada. Gere um novo QR para reconectar.",
        );
        await refetchWhatsapp();
      },
    });
  };

  const handleEnviarTesteWhatsapp = () => {
    enviarTesteWhatsapp.mutate(
      {
        to: whatsappTestPhone,
        message: whatsappTestMessage,
      },
      {
        onSuccess: async (result) => {
          setQrStatusMessage(
            result.success
              ? `Teste enviado via ${result.provider}${result.fallbackUsed ? " com fallback" : ""}.`
              : `Falha no teste: ${result.error ?? "erro desconhecido"}`,
          );
          await refetchWhatsapp();
        },
      },
    );
  };

  const badgeClassByDispatch = (entry: WhatsappDispatchEntry) => {
    if (entry.triggerMode === "FALLBACK") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (entry.status === "FAILED") {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Bell className="w-4 h-4 text-green-600" />
            Notificações de clientes com cobrança pendente
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Painel de notificações
          </h1>
          <p className="text-sm text-gray-600">{fluxoSelecionado.descricao}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 border rounded-md px-3 py-2 bg-gray-50">
            <div>
              <p className="text-xs text-gray-500">Fluxo de envio</p>
              <p className="text-sm font-semibold text-gray-800">
                {fluxoSelecionado.titulo}
              </p>
            </div>
            <Select
              value={tipoAviso}
              onValueChange={(value) => setTipoAviso(value as NotificationFlow)}
            >
              <SelectTrigger className="w-[230px]">
                <SelectValue placeholder="Escolha o fluxo" />
              </SelectTrigger>
              <SelectContent>
                {painelFlowOrder.map((value) => (
                  <SelectItem key={value} value={value} className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">
                        {fluxoOptions[value].titulo}
                      </span>
                      <span className="text-xs text-gray-500">
                        {fluxoOptions[value].descricao}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleDisparar}
              disabled={disparar.isPending || isLoading}
            >
              {disparar.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Disparar agora
            </Button>
          </div>
        </div>
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Erro ao carregar dados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">
            Não foi possível carregar o painel de notificações. Tente novamente
            em instantes.
          </CardContent>
        </Card>
      )}

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Próprio</TabsTrigger>
          <TabsTrigger value="fila">Fila WhatsApp</TabsTrigger>
          <TabsTrigger value="historico">Histórico WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="operacao" className="space-y-6">
          {isPeriodic ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-[#3a9b28] to-[#1e5a14] text-white border-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Clock3 className="w-5 h-5" />
                    Próxima leva
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {data?.agendamento?.ativo ? "Ativo" : "Pausado"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold tracking-tight">
                    {agendamentoAtivo ? (
                      <>
                        {pad(horas)}:{pad(minutos)}:{pad(segundos)}
                      </>
                    ) : (
                      "Pausado"
                    )}
                  </div>
                  <p className="text-sm text-white/80">
                    {agendamentoAtivo
                      ? "Próximo disparo previsto para "
                      : "Agendamento pausado. "}
                    {data?.agendamento
                      ? new Date(
                          data.agendamento.proximaExecucao,
                        ).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  <Progress value={progresso} className="mt-4 bg-white/20" />
                  <p className="text-xs text-white/80 mt-1">
                    {Math.round(progresso)}% do ciclo percorrido
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PauseCircle className="w-5 h-5 text-amber-500" />
                    Ritmo e canal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="frequencia">Intervalo (minutos)</Label>
                      <Input
                        id="frequencia"
                        type="number"
                        min={15}
                        value={frequenciaMinutos}
                        onChange={(e) =>
                          setFrequenciaMinutos(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Canal preferencial</Label>
                      <Select
                        value={metodo}
                        onValueChange={(value) =>
                          setMetodo(value as NotificationChannel)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              WhatsApp
                            </div>
                          </SelectItem>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              E-mail
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="agendamento-ativo"
                        checked={agendamentoAtivo}
                        onCheckedChange={setAgendamentoAtivo}
                      />
                      <Label htmlFor="agendamento-ativo" className="text-sm">
                        {agendamentoAtivo
                          ? "Agendamento ativo"
                          : "Agendamento pausado"}
                      </Label>
                    </div>
                    <Button
                      onClick={handleSalvarAgendamento}
                      disabled={atualizarAgendamento.isPending}
                    >
                      {atualizarAgendamento.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4 mr-2" />
                      )}
                      Salvar ritmo
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                    <Bell className="w-4 h-4 text-green-600" />
                    <p>
                      {resumoContatos.elegiveis} clientes aptos:{" "}
                      {resumoContatos.whatsapp} via WhatsApp,{" "}
                      {resumoContatos.email} via e-mail.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldOff className="w-5 h-5 text-red-500" />
                    Status das listas
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Clientes com pendência
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.pendencias ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bloqueados</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.bloqueados ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sem contato</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.semContato ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Elegíveis</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.elegiveis ?? 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-emerald-200 bg-emerald-50/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock3 className="w-5 h-5 text-emerald-600" />
                    Fluxo de envio único
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">
                    {fluxoSelecionado.descricao} Este fluxo não usa countdown
                    nem agendamento contínuo. Utilize templates dedicados para
                    este fluxo antes de disparar.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline" className="bg-white">
                      {fluxoSelecionado.titulo}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      Templates exclusivos
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      Envio único
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldOff className="w-5 h-5 text-red-500" />
                    Status das listas
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Clientes com pendência
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.pendencias ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bloqueados</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.bloqueados ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sem contato</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.semContato ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Elegíveis</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data?.totais.elegiveis ?? 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                Terminal de envios (logs recentes)
                <Badge variant="outline">{fluxoSelecionado.titulo}</Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                disabled={isLoadingLogs}
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Atualizar logs
              </Button>
            </CardHeader>
            <CardContent>
              <div
                ref={logsRef}
                className="bg-black text-green-200 font-mono rounded-md p-4 h-80 overflow-y-auto text-sm"
              >
                {isLoadingLogs ? (
                  <p>Carregando...</p>
                ) : !Array.isArray(logs) || logs.length === 0 ? (
                  <p className="text-gray-400">
                    Nenhum disparo registrado ainda.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="mb-2">
                      <span className="text-emerald-300">
                        [{new Date(log.createdAt).toLocaleString("pt-BR")}]
                      </span>{" "}
                      <span className="text-white">
                        {log.status.toUpperCase()} via {log.canal}
                      </span>{" "}
                      <span className="text-yellow-200">
                        {log.destinatario ?? "destinatário não informado"}
                      </span>
                      {log.motivo ? (
                        <span className="text-red-300"> — {log.motivo}</span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                Templates de notificação
                <Badge variant="outline" className="bg-gray-50">
                  {flowLabel(tipoAviso)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Nome</Label>
                <Input
                  value={novoTemplate.nome}
                  onChange={(e) =>
                    setNovoTemplate({ ...novoTemplate, nome: e.target.value })
                  }
                  placeholder="Ex.: Cobrança pendente"
                />
                <Label>Canal</Label>
                <Select
                  value={novoTemplate.canal}
                  onValueChange={(value) =>
                    setNovoTemplate((prev) => {
                      const base =
                        value === "whatsapp"
                          ? buildDefaultTemplate("whatsapp", tipoAviso)
                          : buildDefaultTemplate("email", tipoAviso);
                      return {
                        ...prev,
                        canal: value as NotificationChannel,
                        htmlBody: base.html,
                        textBody: base.text,
                        assunto: base.assunto ?? prev.assunto,
                      };
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Este template será usado para o fluxo:{" "}
                  <span className="font-semibold">{flowLabel(tipoAviso)}</span>.
                </p>
                <Label>Assunto</Label>
                <Input
                  value={novoTemplate.assunto}
                  onChange={(e) =>
                    setNovoTemplate({
                      ...novoTemplate,
                      assunto: e.target.value,
                    })
                  }
                  placeholder="Assunto do e-mail"
                />
                <Label>Texto</Label>
                <textarea
                  className="w-full border rounded-md p-2 min-h-[140px]"
                  value={novoTemplate.htmlBody}
                  onChange={(e) =>
                    setNovoTemplate({
                      ...novoTemplate,
                      htmlBody: e.target.value,
                    })
                  }
                  placeholder="Escreva o texto do template"
                />
                <Label>Texto (fallback)</Label>
                <textarea
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  value={novoTemplate.textBody}
                  onChange={(e) =>
                    setNovoTemplate({
                      ...novoTemplate,
                      textBody: e.target.value,
                    })
                  }
                  placeholder="Texto simples (opcional)"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={aplicarModeloPadrao}
                  >
                    Usar modelo padrão ({novoTemplate.canal})
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tpl-default"
                    checked={novoTemplate.isDefault}
                    onCheckedChange={(checked) =>
                      setNovoTemplate({ ...novoTemplate, isDefault: checked })
                    }
                  />
                  <Label htmlFor="tpl-default">Marcar como padrão</Label>
                </div>
                <Button
                  onClick={handleSalvarTemplate}
                  disabled={criarTemplate.isPending}
                >
                  {criarTemplate.isPending ? "Salvando..." : "Salvar template"}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Templates salvos</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchTemplates()}
                  >
                    Atualizar
                  </Button>
                </div>
                <div className="border rounded-md divide-y">
                  {(templates ?? []).length === 0 && (
                    <p className="p-4 text-sm text-gray-500">
                      Nenhum template cadastrado.
                    </p>
                  )}
                  {(templates ?? []).map((tpl) => (
                    <div key={tpl.id} className="p-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{tpl.nome}</p>
                          <p className="text-xs text-gray-500">
                            {tpl.canal.toUpperCase()} •{" "}
                            {flowLabel(tpl.flow as NotificationFlow)} •{" "}
                            {new Date(tpl.updatedAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              templateSelecionadoId === tpl.id
                                ? "default"
                                : "outline"
                            }
                            onClick={() => handleVisualizarTemplate(tpl)}
                          >
                            Visualizar
                          </Button>
                          {!tpl.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDefinirDefault(tpl.id, tpl.canal)
                              }
                            >
                              Definir padrão
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleRemoverTemplate(tpl.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">
                        {tpl.assunto ?? "Sem assunto"}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="w-fit">
                          {flowLabel(tpl.flow as NotificationFlow)}
                        </Badge>
                        {tpl.isDefault && (
                          <Badge variant="outline" className="w-fit">
                            Padrão
                          </Badge>
                        )}
                        {templateSelecionadoId === tpl.id && (
                          <Badge className="w-fit bg-emerald-600 text-white">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Pré-visualização</h4>
                  {novoTemplate.canal === "whatsapp" ? (
                    <pre className="bg-gray-900 text-green-100 p-3 rounded-md text-sm whitespace-pre-wrap">
                      {novoTemplate.htmlBody || novoTemplate.textBody}
                    </pre>
                  ) : (
                    <div
                      className="border rounded-md overflow-hidden"
                      style={{ maxHeight: 320 }}
                    >
                      <iframe
                        title="preview-email"
                        className="w-full h-80"
                        sandbox=""
                        srcDoc={novoTemplate.htmlBody || ""}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-green-600" />
                  Destinatários da próxima leva
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Visualize quem receberá a notificação, o canal e o valor em
                  aberto.
                </p>
              </div>
              <Badge variant="outline">
                {destinatarios.length} clientes listados
              </Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Próximo vencimento</TableHead>
                    <TableHead>Total pendente</TableHead>
                    <TableHead>Qtde</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Bloquear</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : destinatarios.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        Nenhum cliente com cobrança pendente para notificar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    destinatarios.map((destinatario) => (
                      <TableRow key={destinatario.titularId}>
                        <TableCell>
                          <div className="font-semibold">
                            {destinatario.nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {destinatario.cobrancas
                              .slice(0, 2)
                              .map(
                                (cobranca) =>
                                  `${formatDate(cobranca.vencimento)} • ${formatCurrency(
                                    cobranca.valor,
                                  )}`,
                              )
                              .join(" · ")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {destinatario.telefone || destinatario.email || "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {destinatario.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(destinatario.proximoVencimento)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(destinatario.totalPendente)}
                        </TableCell>
                        <TableCell>
                          {destinatario.quantidadeCobrancas}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            {destinatario.metodo === "whatsapp" ? (
                              <Smartphone className="w-4 h-4 text-green-600" />
                            ) : (
                              <Mail className="w-4 h-4 text-blue-600" />
                            )}
                            {destinatario.metodo === "whatsapp"
                              ? "WhatsApp"
                              : "E-mail"}
                          </Badge>
                          <div className="mt-2">
                            <Select
                              value={destinatario.metodo}
                              onValueChange={(value) =>
                                handleAlterarMetodo(
                                  destinatario.titularId,
                                  value as NotificationChannel,
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Canal" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="whatsapp">
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" />
                                    WhatsApp
                                  </div>
                                </SelectItem>
                                <SelectItem value="email">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    E-mail
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={destinatario.bloqueado}
                              onCheckedChange={(checked) =>
                                handleToggleBloqueio(
                                  destinatario.titularId,
                                  checked,
                                )
                              }
                            />
                            <span className="text-xs text-gray-500">
                              {destinatario.bloqueado
                                ? "Bloqueado"
                                : "Permitido"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {whatsappOverview?.connection.ready ? (
                      <Wifi className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-amber-600" />
                    )}
                    Conexão WhatsApp própria
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    O WhatsApp próprio tenta enviar primeiro. A mensageria atual
                    fica como fallback.
                  </p>
                </div>
                <Badge variant="outline">
                  {whatsappOverview?.connection.state ?? "DISCONNECTED"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Enviados hoje</p>
                    <p className="text-2xl font-semibold">
                      {whatsappOverview?.summary.sentToday ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Falhas hoje</p>
                    <p className="text-2xl font-semibold">
                      {whatsappOverview?.summary.failedToday ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500">Fallbacks hoje</p>
                    <p className="text-2xl font-semibold">
                      {whatsappOverview?.summary.fallbackToday ?? 0}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                  Intervalo mínimo automático por cliente:{" "}
                  <span className="font-semibold">
                    {whatsappOverview?.summary.minIntervalMinutes ?? 0} min
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refetchWhatsapp()}
                    disabled={isLoadingWhatsapp}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefreshQr}
                    disabled={isRefreshingQr}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar novo QR
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={handleDisconnectWhatsapp}
                    disabled={desconectarWhatsapp.isPending}
                  >
                    <WifiOff className="w-4 h-4 mr-2" />
                    Desconectar sessão
                  </Button>
                </div>
                {qrStatusMessage ? (
                  <p className="text-sm text-gray-600">{qrStatusMessage}</p>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-start">
                  <div className="rounded-xl border bg-gray-50 p-4 flex items-center justify-center min-h-[320px]">
                    {qrImageSrc ? (
                      <Image
                        src={qrImageSrc}
                        alt="QR Code WhatsApp"
                        width={288}
                        height={288}
                        unoptimized
                        className="w-72 h-72 object-contain"
                      />
                    ) : (
                      <div className="text-center text-sm text-gray-500 space-y-2">
                        <QrCode className="w-8 h-8 mx-auto text-gray-400" />
                        <p>
                          {whatsappOverview?.connection.ready
                            ? "Sessão conectada. Não há QR pendente."
                            : "Gere um QR para conectar a sessão."}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Usar conexão própria</p>
                        <p className="text-sm text-gray-500">
                          O envio principal passa pela sua sessão conectada.
                        </p>
                      </div>
                      <Switch
                        checked={whatsappEnabled}
                        onCheckedChange={setWhatsappEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Manter fallback legado</p>
                        <p className="text-sm text-gray-500">
                          Em falhas do WhatsApp próprio, usa a API atual
                          automaticamente.
                        </p>
                      </div>
                      <Switch
                        checked={whatsappFallbackEnabled}
                        onCheckedChange={setWhatsappFallbackEnabled}
                      />
                    </div>
                    <div className="rounded-lg border p-4 space-y-2">
                      <Label htmlFor="ddi-whatsapp">DDI padrão</Label>
                      <Input
                        id="ddi-whatsapp"
                        value={whatsappCountryCode}
                        onChange={(e) => setWhatsappCountryCode(e.target.value)}
                        placeholder="55"
                      />
                    </div>
                    <div className="rounded-lg border p-4 space-y-3">
                      <p className="font-medium">Janela de envio automático</p>
                      <div className="space-y-2">
                        <Label htmlFor="timezone-whatsapp">Timezone</Label>
                        <Input
                          id="timezone-whatsapp"
                          value={whatsappTimezone}
                          onChange={(e) => setWhatsappTimezone(e.target.value)}
                          placeholder="America/Bahia"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="quiet-start">
                            Início do silêncio
                          </Label>
                          <Input
                            id="quiet-start"
                            value={whatsappQuietStart}
                            onChange={(e) =>
                              setWhatsappQuietStart(e.target.value)
                            }
                            placeholder="22:00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiet-end">Fim do silêncio</Label>
                          <Input
                            id="quiet-end"
                            value={whatsappQuietEnd}
                            onChange={(e) =>
                              setWhatsappQuietEnd(e.target.value)
                            }
                            placeholder="08:00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min-interval">
                          Intervalo mínimo por cliente (minutos)
                        </Label>
                        <Input
                          id="min-interval"
                          type="number"
                          min={1}
                          value={whatsappMinIntervalMinutes}
                          onChange={(e) =>
                            setWhatsappMinIntervalMinutes(
                              Number(e.target.value) || 1,
                            )
                          }
                          placeholder="240"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">
                            Permitir finais de semana
                          </p>
                          <p className="text-sm text-gray-500">
                            Se desligado, disparos automáticos ficam bloqueados
                            em sábado e domingo.
                          </p>
                        </div>
                        <Switch
                          checked={whatsappSendOnWeekends}
                          onCheckedChange={setWhatsappSendOnWeekends}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSalvarWhatsappConfig}
                      disabled={atualizarWhatsappConfig.isPending}
                    >
                      Salvar configuração
                    </Button>
                    <div className="rounded-lg border p-4 space-y-3">
                      <p className="font-medium">Enviar teste manual</p>
                      <div className="space-y-2">
                        <Label htmlFor="teste-whatsapp-numero">
                          Número de destino
                        </Label>
                        <Input
                          id="teste-whatsapp-numero"
                          value={whatsappTestPhone}
                          onChange={(e) => setWhatsappTestPhone(e.target.value)}
                          placeholder="71999999999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teste-whatsapp-mensagem">
                          Mensagem
                        </Label>
                        <textarea
                          id="teste-whatsapp-mensagem"
                          className="w-full border rounded-md p-2 min-h-[88px]"
                          value={whatsappTestMessage}
                          onChange={(e) =>
                            setWhatsappTestMessage(e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEnviarTesteWhatsapp}
                        disabled={
                          enviarTesteWhatsapp.isPending ||
                          !whatsappTestPhone.trim() ||
                          !whatsappTestMessage.trim()
                        }
                      >
                        {enviarTesteWhatsapp.isPending
                          ? "Enviando teste..."
                          : "Enviar teste"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fluxos habilitados no WhatsApp próprio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsappRulesState.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium">{rule.title}</p>
                      <p className="text-sm text-gray-500">
                        {flowLabel(rule.flow)}
                      </p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        setWhatsappRulesState((prev) =>
                          prev.map((item) =>
                            item.id === rule.id
                              ? { ...item, enabled: checked }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fila" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fila prevista do WhatsApp</CardTitle>
                <p className="text-sm text-gray-500">
                  Prévia operacional da ordem de envio para o fluxo atual.
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchWhatsappQueue()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar fila
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Fluxo</p>
                  <p className="font-semibold">
                    {flowLabel(whatsappQueue?.summary.flow ?? tipoAviso)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Modo</p>
                  <p className="font-semibold">
                    {whatsappQueue?.summary.triggerMode ?? "AUTOMATIC"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Na fila</p>
                  <p className="font-semibold">
                    {whatsappQueue?.summary.queued ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Pulados</p>
                  <p className="font-semibold">
                    {whatsappQueue?.summary.skipped ?? 0}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                Base da fila:{" "}
                <span className="font-semibold">
                  {whatsappQueue?.summary.baseTime
                    ? new Date(whatsappQueue.summary.baseTime).toLocaleString(
                        "pt-BR",
                      )
                    : "—"}
                </span>
                {" • "}Intervalo mínimo:{" "}
                <span className="font-semibold">
                  {whatsappQueue?.summary.minIntervalMinutes ?? 0} min
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Previsto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWhatsappQueue ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Carregando fila...
                        </TableCell>
                      </TableRow>
                    ) : !whatsappQueue?.items?.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-gray-500"
                        >
                          Nenhum item calculado para a fila deste fluxo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      whatsappQueue.items.map((item) => (
                        <TableRow
                          key={`${item.titularId}-${item.queuePosition ?? "skip"}`}
                        >
                          <TableCell>{item.queuePosition ?? "—"}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{item.nome}</div>
                            <div className="text-xs text-gray-500">
                              {item.quantidadeCobrancas} cobrança(s)
                            </div>
                          </TableCell>
                          <TableCell>{item.recipient || "—"}</TableCell>
                          <TableCell>
                            {item.expectedAt
                              ? new Date(item.expectedAt).toLocaleString(
                                  "pt-BR",
                                )
                              : "—"}
                            {item.delayedByMinutes > 0 ? (
                              <div className="text-xs text-amber-600">
                                +{item.delayedByMinutes} min
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.status === "QUEUED"
                                  ? "border-emerald-200 text-emerald-700"
                                  : "border-amber-200 text-amber-700"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.blockedReason || "—"}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.totalPendente)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico da conexão própria</CardTitle>
                <p className="text-sm text-gray-500">
                  Os disparos ficam categorizados como AUTOMATIC, MANUAL e
                  FALLBACK.
                </p>
              </div>
              <Button variant="outline" onClick={() => refetchWhatsapp()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {whatsappRecentes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum disparo do WhatsApp próprio foi registrado ainda.
                </p>
              ) : (
                whatsappRecentes.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={badgeClassByDispatch(entry)}>
                        {entry.triggerMode}
                      </Badge>
                      <Badge variant="outline">{entry.status}</Badge>
                      <Badge variant="outline">{entry.provider}</Badge>
                      {entry.flow ? (
                        <Badge variant="outline">
                          {flowLabelFlexible(entry.flow)}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Destinatário: {entry.recipient || "não informado"}</p>
                      <p>
                        Criado em:{" "}
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </p>
                      {entry.sentAt ? (
                        <p>
                          Enviado em:{" "}
                          {new Date(entry.sentAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      {entry.errorMessage ? (
                        <p className="text-red-600">
                          Motivo: {entry.errorMessage}
                        </p>
                      ) : null}
                    </div>
                    {entry.payloadPreview ? (
                      <pre className="bg-gray-950 text-green-100 rounded-md p-3 text-xs whitespace-pre-wrap">
                        {entry.payloadPreview}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
