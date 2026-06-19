import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dadosPessoaisSchema,
  dependentesSchema,
  enderecoSchema,
  responsavelFinanceiroSchema,
} from "./schemas";

const validDadosPessoais = {
  nomeCompleto: "Cliente Teste",
  cpf: "123.456.789-01",
  dataNascimento: "1990-06-18",
  sexo: "Masculino",
  rg: "1234567",
  naturalidade: "Salvador",
  situacaoConjugal: "Solteiro",
  profissao: "Analista",
  telefone: "(71) 99999-9999",
  whatsapp: "(71) 99999-9999",
  email: "cliente@teste.com",
};

const validEndereco = {
  cep: "40000-000",
  uf: "BA",
  cidade: "Salvador",
  bairro: "Centro",
  logradouro: "Rua A",
  complemento: "Apto 10",
  numero: "10",
  pontoReferencia: "Praca principal",
};

const validResponsavel = {
  usarMesmosDados: false,
  nomeCompleto: "Responsavel Teste",
  cpf: "987.654.321-00",
  rg: "7654321",
  dataNascimento: "1990-06-18",
  sexo: "Feminino",
  naturalidade: "Salvador",
  parentesco: "Cônjuge",
  email: "responsavel@teste.com",
  telefone: "(71) 98888-7777",
  whatsapp: "(71) 98888-7777",
  situacaoConjugal: "Casado(a)",
  profissao: "Advogada",
  cep: "40000-000",
  uf: "BA",
  cidade: "Salvador",
  bairro: "Centro",
  logradouro: "Rua B",
  complemento: "Casa",
  numero: "20",
  pontoReferencia: "Mercado",
};

const validDependentes = {
  dependentes: [
    {
      nome: "Dependente Teste",
      idade: "10",
      parentesco: "Filho(a)",
      telefone: "(71) 98888-7777",
      cpf: "123.456.789-01",
    },
  ],
};

const getFieldErrors = (result: {
  success: false;
  error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } };
}) => result.error.flatten().fieldErrors;

afterEach(() => {
  vi.useRealTimers();
});

describe("dadosPessoaisSchema", () => {
  it("aceita dados válidos com espaços extras", () => {
    const result = dadosPessoaisSchema.parse({
      ...validDadosPessoais,
      nomeCompleto: "  Cliente Teste  ",
      email: "  cliente@teste.com  ",
    });

    expect(result.nomeCompleto).toBe("Cliente Teste");
    expect(result.email).toBe("cliente@teste.com");
  });

  it.each([
    ["nomeCompleto", "Nome completo é obrigatório"],
    ["dataNascimento", "Data de nascimento é obrigatória"],
    ["naturalidade", "Naturalidade é obrigatória"],
    ["situacaoConjugal", "Situação conjugal é obrigatória"],
    ["profissao", "Profissão é obrigatória"],
  ] as const)("exige %s", (field, message) => {
    const result = dadosPessoaisSchema.safeParse({
      ...validDadosPessoais,
      [field]: "   ",
    });

    expect(result.success).toBe(false);
    expect(getFieldErrors(result)[field]?.[0]).toBe(message);
  });

  it("rejeita cpf, telefone, whatsapp, e-mail e sexo inválidos", () => {
    const result = dadosPessoaisSchema.safeParse({
      ...validDadosPessoais,
      cpf: "123",
      telefone: "9999",
      whatsapp: "9999",
      email: "email-invalido",
      sexo: "Outro",
    });

    expect(result.success).toBe(false);
    const errors = getFieldErrors(result);
    expect(errors.cpf?.[0]).toBe("CPF inválido");
    expect(errors.telefone?.[0]).toBe("Telefone inválido");
    expect(errors.whatsapp?.[0]).toBe("WhatsApp inválido");
    expect(errors.email?.[0]).toBe("E-mail inválido");
    expect(errors.sexo?.[0]).toBe("Selecione uma opção válida para sexo");
  });
});

describe("enderecoSchema", () => {
  it("aceita complemento vazio como opcional", () => {
    const result = enderecoSchema.parse({
      ...validEndereco,
      complemento: "   ",
    });

    expect(result.complemento).toBeUndefined();
  });

  it.each([
    ["cep", "CEP é obrigatório"],
    ["uf", "UF é obrigatória"],
    ["cidade", "Cidade é obrigatória"],
    ["bairro", "Bairro é obrigatório"],
    ["logradouro", "Logradouro é obrigatório"],
    ["numero", "Número é obrigatório"],
    ["pontoReferencia", "Ponto de referência é obrigatório"],
  ] as const)("exige %s", (field, message) => {
    const result = enderecoSchema.safeParse({
      ...validEndereco,
      [field]: "   ",
    });

    expect(result.success).toBe(false);
    expect(getFieldErrors(result)[field]?.[0]).toBe(message);
  });
});

describe("responsavelFinanceiroSchema", () => {
  it("permite campos vazios quando usarMesmosDados for true", () => {
    const result = responsavelFinanceiroSchema.parse({
      usarMesmosDados: true,
      nomeCompleto: "   ",
      cpf: "   ",
      dataNascimento: "   ",
      email: "   ",
      telefone: "   ",
      whatsapp: "   ",
    });

    expect(result).toEqual({
      usarMesmosDados: true,
      nomeCompleto: undefined,
      cpf: undefined,
      dataNascimento: undefined,
      email: undefined,
      telefone: undefined,
      whatsapp: undefined,
    });
  });

  it("exige os campos obrigatórios quando usarMesmosDados for false", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"));

    const result = responsavelFinanceiroSchema.safeParse({
      usarMesmosDados: false,
    });

    expect(result.success).toBe(false);
    const errors = getFieldErrors(result);
    expect(errors.nomeCompleto?.[0]).toBe(
      "Nome completo do corresponsável é obrigatório",
    );
    expect(errors.cpf?.[0]).toBe("CPF do corresponsável é obrigatório");
    expect(errors.dataNascimento?.[0]).toBe(
      "Data de nascimento do corresponsável é obrigatória",
    );
    expect(errors.parentesco?.[0]).toBe(
      "Parentesco do corresponsável é obrigatório",
    );
    expect(errors.email?.[0]).toBe("E-mail do corresponsável é obrigatório");
  });

  it("rejeita menor de idade e formatos inválidos do corresponsável", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"));

    const result = responsavelFinanceiroSchema.safeParse({
      ...validResponsavel,
      dataNascimento: "2010-06-19",
      cpf: "123",
      parentesco: "Vizinho",
      email: "invalido",
      cep: "123",
      telefone: "123",
      whatsapp: "123",
    });

    expect(result.success).toBe(false);
    const errors = getFieldErrors(result);
    expect(errors.dataNascimento?.[0]).toBe(
      "Corresponsável deve ser maior de idade (18+)",
    );
    expect(errors.cpf?.[0]).toBe("CPF do corresponsável inválido");
    expect(errors.parentesco?.[0]).toBe("Selecione um parentesco válido");
    expect(errors.email?.[0]).toBe("E-mail inválido");
    expect(errors.cep?.[0]).toBe("CEP do corresponsável inválido");
    expect(errors.telefone?.[0]).toBe("Telefone do corresponsável inválido");
    expect(errors.whatsapp?.[0]).toBe("WhatsApp do corresponsável inválido");
  });
});

describe("dependentesSchema", () => {
  it("aceita dependente com cpf e telefone opcionais vazios", () => {
    const result = dependentesSchema.parse({
      dependentes: [
        {
          nome: "Dependente Teste",
          idade: "10",
          parentesco: "Filho(a)",
          telefone: "   ",
          cpf: "   ",
        },
      ],
    });

    expect(result.dependentes[0].telefone).toBeUndefined();
    expect(result.dependentes[0].cpf).toBeUndefined();
  });

  it("rejeita campos obrigatórios e documentos inválidos do dependente", () => {
    const result = dependentesSchema.safeParse({
      dependentes: [
        {
          ...validDependentes.dependentes[0],
          nome: "   ",
          idade: "   ",
          parentesco: "   ",
          telefone: "123",
          cpf: "123",
        },
      ],
    });

    expect(result.success).toBe(false);
    const issueMap = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    );

    expect(issueMap["dependentes.0.nome"]).toBe("Nome é obrigatório");
    expect(issueMap["dependentes.0.idade"]).toBe("Idade é obrigatória");
    expect(issueMap["dependentes.0.parentesco"]).toBe(
      "Parentesco é obrigatório",
    );
    expect(issueMap["dependentes.0.telefone"]).toBe("Telefone inválido");
    expect(issueMap["dependentes.0.cpf"]).toBe("CPF inválido");
  });
});
