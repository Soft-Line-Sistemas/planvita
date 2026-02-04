"use client";

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
import { usePainelNotificacoesRecorrentes } from "@/hooks/queries/usePainelNotificacoesRecorrentes";
import {
  useAtualizarAgendamentoNotificacao,
  useDispararNotificacoesRecorrentes,
  useToggleBloqueioNotificacao,
  useAtualizarMetodoNotificacao,
  useCriarTemplate,
  useAtualizarTemplate,
  useRemoverTemplate,
} from "@/hooks/mutations/useNotificacoesRecorrentesMutations";
import { useLogsNotificacoes } from "@/hooks/queries/useLogsNotificacoes";
import { useTemplatesNotificacoes } from "@/hooks/queries/useTemplatesNotificacoes";
import {
  NotificationChannel,
  NotificationTemplate,
  NotificationFlow,
} from "@/types/Notification";
import getTenantFromHost from "@/utils/getTenantFromHost";

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
};

const flowLabel = (flow?: NotificationFlow | null) =>
  flow && fluxoOptions[flow] ? fluxoOptions[flow].titulo : "Todos os fluxos";

export default function NotificacoesRecorrentesPage() {
  const [tipoAviso, setTipoAviso] = useState<NotificationFlow>(
    "pendencia-periodica",
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
  const tenantSlug =
    typeof window !== "undefined" ? getTenantFromHost() : "lider";

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

      if (flow === "pendencia-periodica") {
        assunto = "Lembrete de pendência financeira";
        if (canal === "email") {
          html = `<p>Olá, ${nomeEmpresa} informa: Consta em nosso sistema uma pendência financeira.</p>`;
          text = `Olá, ${nomeEmpresa} informa: Consta em nosso sistema uma pendência financeira.`;
        } else {
          text = `Olá, ${nomeEmpresa} informa: Consta em nosso sistema uma pendência financeira.`;
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
                {Object.entries(fluxoOptions).map(([value, option]) => (
                  <SelectItem key={value} value={value} className="py-2">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold">{option.titulo}</span>
                      <span className="text-xs text-gray-500">
                        {option.descricao}
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

      {isPeriodic ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-600 to-green-700 text-white">
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
              <p className="text-sm text-emerald-100">
                {agendamentoAtivo
                  ? "Próximo disparo previsto para "
                  : "Agendamento pausado. "}
                {data?.agendamento
                  ? new Date(data.agendamento.proximaExecucao).toLocaleString(
                      "pt-BR",
                    )
                  : "—"}
              </p>
              <Progress value={progresso} className="mt-4 bg-white/20" />
              <p className="text-xs text-emerald-100 mt-1">
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
                  {resumoContatos.whatsapp} via WhatsApp, {resumoContatos.email}{" "}
                  via e-mail.
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
                <p className="text-sm text-gray-500">Clientes com pendência</p>
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
                {fluxoSelecionado.descricao} Este fluxo não usa countdown nem
                agendamento contínuo. Utilize templates dedicados para este
                fluxo antes de disparar.
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
                <p className="text-sm text-gray-500">Clientes com pendência</p>
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
              <p className="text-gray-400">Nenhum disparo registrado ainda.</p>
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
                setNovoTemplate({ ...novoTemplate, assunto: e.target.value })
              }
              placeholder="Assunto do e-mail"
            />
            <Label>Texto</Label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[140px]"
              value={novoTemplate.htmlBody}
              onChange={(e) =>
                setNovoTemplate({ ...novoTemplate, htmlBody: e.target.value })
              }
              placeholder="Escreva o texto do template"
            />
            <Label>Texto (fallback)</Label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[80px]"
              value={novoTemplate.textBody}
              onChange={(e) =>
                setNovoTemplate({ ...novoTemplate, textBody: e.target.value })
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
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Nenhum cliente com cobrança pendente para notificar.
                  </TableCell>
                </TableRow>
              ) : (
                destinatarios.map((destinatario) => (
                  <TableRow key={destinatario.titularId}>
                    <TableCell>
                      <div className="font-semibold">{destinatario.nome}</div>
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
                    <TableCell>{destinatario.quantidadeCobrancas}</TableCell>
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
                          {destinatario.bloqueado ? "Bloqueado" : "Permitido"}
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
    </div>
  );
}
