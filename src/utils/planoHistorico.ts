import type { ClientePlano } from "@/types/ClientePlano";

export type HistoricoPlanoItem = {
  id: string;
  titulo: string;
  data: string;
  descricao: string;
  sortDate: string;
  concluido: boolean;
};

const REQUIRED_SIGNATURE_TYPES = [
  "TITULAR_ASSINATURA_1",
  "TITULAR_ASSINATURA_2",
  "CORRESPONSAVEL_ASSINATURA_1",
  "CORRESPONSAVEL_ASSINATURA_2",
];

const getLatestRequiredSignatureDate = (
  assinaturas: ClientePlano["assinaturas"],
): string | null => {
  if (!assinaturas?.length) return null;

  const byType = new Map(
    assinaturas
      .filter((assinatura) => assinatura?.tipo)
      .map((assinatura) => [assinatura.tipo, assinatura]),
  );

  const required = REQUIRED_SIGNATURE_TYPES.map((tipo) => byType.get(tipo));
  if (required.some((assinatura) => !assinatura?.createdAt)) return null;

  return required.reduce<string | null>((latest, assinatura) => {
    if (!assinatura?.createdAt) return latest;
    if (!latest) return assinatura.createdAt;
    return new Date(assinatura.createdAt).getTime() > new Date(latest).getTime()
      ? assinatura.createdAt
      : latest;
  }, null);
};

const getMaxDate = (
  ...values: Array<string | null | undefined>
): string | null => {
  const validValues = values.filter((value): value is string => {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
  });

  if (!validValues.length) return null;

  return validValues.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
  );
};

const hasComplementaryBenefits = (cliente: ClientePlano) =>
  cliente.plano.cobertura.some((item) => {
    const normalized = item.toLowerCase();
    return normalized.includes("benef") || normalized.includes("parce");
  });

export const buildPlanoHistorico = (
  cliente: ClientePlano,
): HistoricoPlanoItem[] => {
  const { plano } = cliente;
  const dataContratacao = cliente.dataContratacao ?? null;
  const pagamentoConfirmadoEm = cliente.pagamentoConfirmadoEm ?? null;
  const ultimaAssinaturaObrigatoriaEm = getLatestRequiredSignatureDate(
    cliente.assinaturas,
  );
  const ativadoEm =
    plano.ativadoEm ??
    getMaxDate(pagamentoConfirmadoEm, ultimaAssinaturaObrigatoriaEm);
  const items: HistoricoPlanoItem[] = [];

  if (dataContratacao) {
    items.push({
      id: "contratacao",
      titulo: "Contratação",
      data: dataContratacao,
      descricao:
        "Proposta formalizada e contrato emitido para adesão do titular ao plano.",
      sortDate: dataContratacao,
      concluido: true,
    });
  }

  if (pagamentoConfirmadoEm) {
    items.push({
      id: "pagamento-confirmado",
      titulo: "Pagamento da adesão confirmado",
      data: pagamentoConfirmadoEm,
      descricao:
        "Pagamento inicial reconhecido e liberado para continuidade da implantação do plano.",
      sortDate: pagamentoConfirmadoEm,
      concluido: true,
    });
  }

  if (ultimaAssinaturaObrigatoriaEm) {
    items.push({
      id: "assinaturas-concluidas",
      titulo: "Assinaturas concluídas",
      data: ultimaAssinaturaObrigatoriaEm,
      descricao:
        "Assinaturas obrigatórias do titular e do corresponsável financeiro registradas com sucesso.",
      sortDate: ultimaAssinaturaObrigatoriaEm,
      concluido: true,
    });
  }

  if (ativadoEm) {
    items.push({
      id: "implantacao",
      titulo: "Implantação da vigência",
      data: ativadoEm,
      descricao: `Ativação do plano ${plano.nome} com início da cobertura conforme regras do contrato.`,
      sortDate: ativadoEm,
      concluido: true,
    });
  }

  if (ativadoEm && hasComplementaryBenefits(cliente)) {
    items.push({
      id: "beneficios",
      titulo: "Benefícios complementares habilitados",
      data: ativadoEm,
      descricao:
        "Rede de parceiros e benefícios do plano disponibilizada conforme a cobertura contratada.",
      sortDate: ativadoEm,
      concluido: true,
    });
  }

  if (plano.status === "ativo" && ativadoEm) {
    items.push({
      id: "status-atual",
      titulo: "Status do plano",
      data: ativadoEm,
      descricao:
        "Plano ativo, contrato vigente e acompanhamento cadastral disponível pelo aplicativo.",
      sortDate: ativadoEm,
      concluido: true,
    });
  } else if (plano.status === "pendente_assinatura" && pagamentoConfirmadoEm) {
    items.push({
      id: "status-atual",
      titulo: "Status do plano",
      data: pagamentoConfirmadoEm,
      descricao:
        "Pagamento confirmado, aguardando a conclusão das assinaturas obrigatórias para ativação do plano.",
      sortDate: pagamentoConfirmadoEm,
      concluido: true,
    });
  }

  return items.sort(
    (a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime(),
  );
};
