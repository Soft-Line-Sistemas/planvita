const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname);
const DATA_INICIO = new Date("2026-03-20");

const tasks = [
  {
    id: "WI-802",
    nome: "Emitir parecer final Go ou No-Go",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Média",
    horas: 8,
    prazoDias: 1,
    obs: "Cliente precisa validar resultado técnico e decidir go-live",
  },
  {
    id: "WI-800",
    nome: "Validar pendencias criticas e altas",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 16,
    prazoDias: 2,
    obs: "Cliente precisa validar que não há bloqueios críticos",
  },
  {
    id: "WI-799",
    nome: "Emitir relatorio diario de status",
    status: "todo",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 4,
    prazoDias: 1,
    obs: "Task interna de gestão - não depende do cliente",
  },
  {
    id: "WI-798",
    nome: "Executar regressao final completa",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 3,
    obs: "Cliente precisa executar testes de regressão",
  },
  {
    id: "WI-796",
    nome: "Congelamento de escopo pre-go-live",
    status: "todo",
    dependeCliente: "NÃO",
    complexidade: "Baixa",
    horas: 2,
    prazoDias: 0,
    obs: "Task de gestão - não depende do cliente",
  },
  {
    id: "WI-795",
    nome: "Triagem diaria de bugs",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 8,
    prazoDias: 1,
    obs: "Task interna de desenvolvimento",
  },
  {
    id: "WI-794",
    nome: "Retestar todas as correções entregues",
    status: "in development",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 16,
    prazoDias: 2,
    obs: "Cliente precisa retestar correções",
  },
  {
    id: "WI-792",
    nome: "Aplicar correções durante homologação",
    status: "in development",
    dependeCliente: "SIM",
    complexidade: "Média",
    horas: 12,
    prazoDias: 2,
    obs: "Cliente precisa testar ajustes solicitados",
  },
  {
    id: "WI-791",
    nome: "Implementar bloqueio automático por falta de pagamento",
    status: "ready to test",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 8,
    prazoDias: 0,
    obs: "Implementado - aguardando deploy/teste",
  },
  {
    id: "WI-790",
    nome: "Executar rodada 2 de testes em banco limpo",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 3,
    obs: "Cliente precisa executar testes",
  },
  {
    id: "WI-788",
    nome: "Executar rodada 6 de testes em banco limpo",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 5,
    obs: "Cliente precisa executar testes",
  },
  {
    id: "WI-789",
    nome: "Executar rodada 5 de testes em banco limpo",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 4,
    obs: "Cliente precisa executar testes",
  },
  {
    id: "WI-787",
    nome: "Executar rodada 4 de testes em banco limpo",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 4,
    obs: "Cliente precisa executar testes",
  },
  {
    id: "WI-786",
    nome: "Executar rodada 3 de testes em banco limpo",
    status: "todo",
    dependeCliente: "SIM",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 3,
    obs: "Cliente precisa executar testes",
  },
  {
    id: "WI-783",
    nome: "Preparar checklist operacional diario",
    status: "todo",
    dependeCliente: "NÃO",
    complexidade: "Baixa",
    horas: 4,
    prazoDias: 1,
    obs: "Task interna de gestão",
  },
  {
    id: "WI-776",
    nome: "Possibilitar o vínculo de Consultor",
    status: "ready to test",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 8,
    prazoDias: 0,
    obs: "Implementado - aguardando deploy",
  },
  {
    id: "WI-739",
    nome: "A lógica do plano ir direcionado ao plano correto",
    status: "ready to test",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 16,
    prazoDias: 0,
    obs: "Implementado - aguardando test",
  },
  {
    id: "WI-736",
    nome: "Aplicar carência de 35 dias",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 12,
    prazoDias: 1,
    obs: "Desenvolvimento em andamento",
  },
  {
    id: "WI-735",
    nome: "Cobrir com testes",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 16,
    prazoDias: 2,
    obs: "Desenvolvimento em andamento",
  },
  {
    id: "WI-734",
    nome: "Garantir consistência nos 2 fluxos",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 1,
    obs: "Desenvolvimento em andamento",
  },
  {
    id: "WI-733",
    nome: "Mudar gatilho da comissão",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 8,
    prazoDias: 1,
    obs: "Desenvolvimento em andamento",
  },
  {
    id: "WI-732",
    nome: "Criar rastreabilidade da cobrança",
    status: "in development",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 2,
    obs: "Desenvolvimento em andamento",
  },
  {
    id: "WI-731",
    nome: "Comissionamento",
    status: "ready to test",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 0,
    obs: "Implementado - aguardando test",
  },
  {
    id: "WI-595",
    nome: "Indicador (KPI) - Novas Vidas",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 16,
    prazoDias: 5,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-590",
    nome: "Indicador (KPI) - Liquidez de caixa",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 20,
    prazoDias: 7,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-594",
    nome: "Indicador (KPI) - Taxa de cancelamento",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 4,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-593",
    nome: "Indicador (KPI) - Receita Recorrente Mensal",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 3,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-592",
    nome: "Indicador (KPI) - EBITDA Operacional",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Alta",
    horas: 24,
    prazoDias: 8,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-591",
    nome: "Indicador (KPI) - Taxa de Inadimplência Global",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 4,
    obs: "Desenvolvimento",
  },
  {
    id: "WI-589",
    nome: "Indicador (KPI) - Performance Link Vendedor",
    status: "planned",
    dependeCliente: "NÃO",
    complexidade: "Média",
    horas: 12,
    prazoDias: 3,
    obs: "Desenvolvimento",
  },
];

function calcularDataEntrega(prazoDias) {
  const data = new Date(DATA_INICIO);
  data.setDate(data.getDate() + prazoDias);
  return data.toLocaleDateString("pt-BR");
}

function calcularHorasDev() {
  return tasks
    .filter((t) => t.dependeCliente === "NÃO")
    .reduce((acc, t) => acc + t.horas, 0);
}

function calcularHorasCliente() {
  return tasks
    .filter((t) => t.dependeCliente === "SIM")
    .reduce((acc, t) => acc + t.horas, 0);
}

const wsData = [
  ["RELATÓRIO DE TAREFAS - PAX-LIDER"],
  ["Data Início: 20/03/2026"],
  [""],
  ["RESUMO"],
  [`Total de Tarefas: ${tasks.length}`],
  [`Horas DEV (internas): ${calcularHorasDev()}h`],
  [`Horas Cliente (dependem do cliente): ${calcularHorasCliente()}h`],
  [""],
  ["TABELA PRINCIPAL"],
  [
    "ID",
    "Nome Task",
    "Status",
    "Depende Cliente",
    "Complexidade",
    "Horas",
    "Prazo Dias",
    "Data Entrega",
    "Observações",
  ],
];

tasks.forEach((t) => {
  wsData.push([
    t.id,
    t.nome,
    t.status,
    t.dependeCliente,
    t.complexidade,
    t.horas,
    t.prazoDias,
    calcularDataEntrega(t.prazoDias),
    t.obs,
  ]);
});

wsData.push([]);
wsData.push(["TAREFAS QUE DEPENDEM DO CLIENTE (para cobrar)"]);
wsData.push([
  "ID",
  "Nome Task",
  "Status",
  "Complexidade",
  "Horas",
  "Prazo Dias",
  "Data Entrega",
]);

tasks
  .filter((t) => t.dependeCliente === "SIM")
  .forEach((t) => {
    wsData.push([
      t.id,
      t.nome,
      t.status,
      t.complexidade,
      t.horas,
      t.prazoDias,
      calcularDataEntrega(t.prazoDias),
    ]);
  });

wsData.push([]);
wsData.push(["TAREFAS DE DESENVOLVIMENTO (DEV)"]);
wsData.push([
  "ID",
  "Nome Task",
  "Status",
  "Complexidade",
  "Horas",
  "Prazo Dias",
  "Data Entrega",
]);

tasks
  .filter((t) => t.dependeCliente === "NÃO")
  .forEach((t) => {
    wsData.push([
      t.id,
      t.nome,
      t.status,
      t.complexidade,
      t.horas,
      t.prazoDias,
      calcularDataEntrega(t.prazoDias),
    ]);
  });

const ws = XLSX.utils.aoa_to_sheet(wsData);
ws["!cols"] = [
  { wch: 8 },
  { wch: 45 },
  { wch: 15 },
  { wch: 12 },
  { wch: 12 },
  { wch: 8 },
  { wch: 10 },
  { wch: 12 },
  { wch: 40 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Tarefas PAX-LIDER");

const outputPath = path.join(OUTPUT_DIR, "relatorio_paxlider_tarefas.xlsx");
XLSX.writeFile(wb, outputPath);

console.log(`✅ Excel gerado: ${outputPath}`);
console.log(`📊 Total de tarefas: ${tasks.length}`);
console.log(`⏱️  Horas DEV: ${calcularHorasDev()}h`);
console.log(`👤 Horas Cliente: ${calcularHorasCliente()}h`);
