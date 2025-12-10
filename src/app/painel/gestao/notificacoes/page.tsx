"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function NotificacoesRecorrentesPage() {
  const { data, isLoading, isError, refetch } =
    usePainelNotificacoesRecorrentes();
  const disparar = useDispararNotificacoesRecorrentes();
  const atualizarAgendamento = useAtualizarAgendamentoNotificacao();
  const toggleBloqueio = useToggleBloqueioNotificacao();
  const atualizarMetodo = useAtualizarMetodoNotificacao();
  const {
    data: logs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useLogsNotificacoes(50);
  const { data: templates, refetch: refetchTemplates } =
    useTemplatesNotificacoes();
  const criarTemplate = useCriarTemplate();
  const atualizarTemplate = useAtualizarTemplate();
  const removerTemplate = useRemoverTemplate();
  const tenantSlug =
    typeof window !== "undefined" ? getTenantFromHost() : "lider";

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
  });
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState<
    number | null
  >(null);
  const logsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data?.agendamento) {
      setContadorSegundos(
        data.agendamento.ativo ? data.agendamento.segundosRestantes : 0,
      );
      setFrequenciaMinutos(data.agendamento.frequenciaMinutos);
      setMetodo(data.agendamento.metodoPreferencial);
      setAgendamentoAtivo(data.agendamento.ativo);
    }
  }, [data]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!agendamentoAtivo) return;
    const timer = setInterval(() => {
      setContadorSegundos((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [agendamentoAtivo]);

  const destinatarios = useMemo(
    () => data?.destinatarios ?? [],
    [data?.destinatarios],
  );

  const progresso =
    agendamentoAtivo && frequenciaMinutos > 0
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
    toggleBloqueio.mutate({ titularId, bloqueado });
  };

  const handleAlterarMetodo = (
    titularId: number,
    metodo: NotificationChannel,
  ) => {
    atualizarMetodo.mutate({ titularId, metodo });
  };

  const handleDisparar = () => {
    disparar.mutate(undefined, {
      onSuccess: () => {
        refetch();
        refetchLogs();
      },
    });
  };

  const buildDefaultTemplate = (canal: NotificationChannel) => {
    const tenant = (tenantSlug || "lider").toLowerCase();
    const nomeEmpresa =
      tenant === "bosque"
        ? "PLANO FAMILIAR CAMPO DO BOSQUE LTDA"
        : tenant === "pax"
          ? "PAX PLANVITA"
          : "LIDER PLANVITA";
    const urlBase = `https://${tenant}.planvita.com.br`;
    const urlCobranca = `${urlBase}/cliente`;

    if (canal === "whatsapp") {
      const texto =
        "Olá, {{nomeCliente}}\n" +
        `Sua cobrança gerada por ${nomeEmpresa} no valor de {{valor}} vence em {{vencimento}}.\n` +
        "Descrição: {{descricao}}.\n" +
        `Visualize/regularize em: ${urlCobranca}`;
      return { html: texto, text: texto };
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #16a34a, #0d7a35); color: #ffffff; padding: 18px 24px; display: flex; align-items: center; gap: 12px;">
          <div>
            <div style="font-size: 14px; opacity: 0.9;">${nomeEmpresa}</div>
            <div style="font-size: 12px; opacity: 0.9;">51.121.484/0001-68</div>
          </div>
        </div>
        <div style="padding: 24px; color: #0f172a;">
          <p style="font-size: 16px; margin: 0 0 12px 0;">Olá, {{nomeCliente}}.</p>
          <p style="font-size: 14px; margin: 0 0 12px 0;">
            Lembramos que a sua cobrança gerada por <strong>${nomeEmpresa}</strong>
            no valor de <strong>{{valor}}</strong> vence em
            <strong>{{vencimento}}</strong>.
          </p>
          <p style="font-size: 14px; margin: 0 0 16px 0;">
            Descrição da cobrança: {{descricao}}
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${urlCobranca}" style="background: #16a34a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Visualizar cobrança
            </a>
          </div>
          <p style="font-size: 13px; color: #475569;">Clique no botão acima para visualizar a cobrança. Ou acesse: ${urlBase}</p>
        </div>
        <div style="background: #0f172a; color: #e2e8f0; padding: 18px 24px; font-size: 12px;">
          <strong>${nomeEmpresa}</strong><br/>
          51.121.484/0001-68<br/>
          <a href="${urlBase}" style="color: #a7f3d0;">${urlBase}</a><br/>
          <a href="mailto:pfcampodobosque@gmail.com" style="color: #a7f3d0;">pfcampodobosque@gmail.com</a><br/>
          (71) 3034-7323<br/>
          Avenida Centenário, 21, LOJA 80, Garcia<br/>
          CEP: 40100180<br/>
          Salvador - BA
        </div>
      </div>
    </div>
    `;
    const texto =
      "Olá, {{nomeCliente}}. Lembramos que sua cobrança gerada por {{nomeEmpresa}} no valor de {{valor}} vence em {{vencimento}}. Descrição: {{descricao}}. Acesse: {{linkCobranca}}";

    return { html, text: texto };
  };

  const aplicarModeloPadrao = () => {
    const base = buildDefaultTemplate(
      novoTemplate.canal as NotificationChannel,
    );
    setNovoTemplate((prev) => ({
      ...prev,
      htmlBody: base.html,
      textBody: base.text,
    }));
    setTemplateSelecionadoId(null);
  };

  const handleSalvarTemplate = () => {
    const payload = {
      ...novoTemplate,
      canal: novoTemplate.canal as NotificationChannel,
    };
    criarTemplate.mutate(payload, {
      onSuccess: () => {
        refetchTemplates();
      },
    });
  };

  const handleDefinirDefault = (id: number, canal: NotificationChannel) => {
    atualizarTemplate.mutate(
      { id, payload: { isDefault: true, canal } },
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
            Notificações recorrentes de clientes com cobrança pendente
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Painel de notificações
          </h1>
          <p className="text-sm text-gray-600">
            Acompanhe quem será avisado, o canal de envio e controle bloqueios.
          </p>
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
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" />
            Terminal de envios (logs recentes)
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
        <CardHeader>
          <CardTitle>Templates de notificação</CardTitle>
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
                      ? buildDefaultTemplate("whatsapp")
                      : buildDefaultTemplate("email");
                  return {
                    ...prev,
                    canal: value as NotificationChannel,
                    htmlBody: base.html,
                    textBody: base.text,
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
