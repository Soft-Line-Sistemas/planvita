export interface PlanoDetalhes {
  id: string;
  nome: string;
  codigo: string;
  status: "ativo" | "inativo" | "suspenso";
  vigencia: {
    inicio: string;
    fim: string;
  };
  valorMensal: number;
  cobertura: string[];
  observacoes?: string;
}

export interface ClientePlano {
  cpf: string;
  nome: string;
  numeroCarteirinha: string;
  email: string;
  telefone: string;
  plano: PlanoDetalhes;
}

export const clientesPlanosMock: ClientePlano[] = [
  {
    cpf: "123.456.789-00",
    nome: "Maria da Silva",
    numeroCarteirinha: "PV-2024-001",
    email: "maria.silva@example.com",
    telefone: "(11) 91234-5678",
    plano: {
      id: "plano-premium-familiar",
      nome: "Familiar Premium",
      codigo: "FAM-PRE-2024",
      status: "ativo",
      vigencia: {
        inicio: "2024-01-10",
        fim: "2025-01-09",
      },
      valorMensal: 289.9,
      cobertura: [
        "Cobertura completa funerária 24h",
        "Assistência psicológica",
        "Translado nacional",
        "Descontos exclusivos em parceiros",
      ],
      observacoes: "Plano com carência reduzida para dependentes até 12 anos.",
    },
  },
  {
    cpf: "987.654.321-99",
    nome: "João Pereira",
    numeroCarteirinha: "PV-2023-145",
    email: "joao.pereira@example.com",
    telefone: "(21) 99876-5432",
    plano: {
      id: "plano-individual-essencial",
      nome: "Individual Essencial",
      codigo: "IND-ESS-2023",
      status: "ativo",
      vigencia: {
        inicio: "2023-07-01",
        fim: "2024-06-30",
      },
      valorMensal: 159.5,
      cobertura: [
        "Assistência funeral básica",
        "Cobertura para titular + 1 dependente",
        "Atendimento nacional",
      ],
      observacoes: "Renovação automática ao final do período.",
    },
  },
  {
    cpf: "456.789.123-55",
    nome: "Ana Rodrigues",
    numeroCarteirinha: "PV-2024-317",
    email: "ana.rodrigues@example.com",
    telefone: "(31) 93456-7810",
    plano: {
      id: "plano-corporativo-plus",
      nome: "Corporativo Plus",
      codigo: "COR-PLUS-2024",
      status: "ativo",
      vigencia: {
        inicio: "2024-03-15",
        fim: "2025-03-14",
      },
      valorMensal: 349.0,
      cobertura: [
        "Cobertura completa para até 4 dependentes",
        "Assistência jurídica",
        "Benefícios corporativos exclusivos",
        "Rede de benefícios em saúde e bem-estar",
      ],
      observacoes:
        "Plano elegível para atualização de dependentes a qualquer momento.",
    },
  },
];
