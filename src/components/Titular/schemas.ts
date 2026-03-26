import { z } from "zod";
import { RELATIONSHIP_OPTIONS } from "@/constants/relationshipOptions";

const calcularIdade = (dataNascimento?: string): number | null => {
  if (!dataNascimento) return null;
  const data = new Date(dataNascimento);
  if (Number.isNaN(data.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const mes = hoje.getMonth() - data.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) {
    idade -= 1;
  }
  return idade;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const requiredText = (message: string, max = 1000) =>
  z.preprocess(
    normalizeString,
    z.string().min(1, message).max(max, `Máximo de ${max} caracteres`),
  );

const optionalText = (max = 1000) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(max, `Máximo de ${max} caracteres`).optional(),
  );

const requiredDigits = (minDigits: number, message: string) =>
  z.preprocess(
    normalizeString,
    z.string().refine((value) => value.replace(/\D/g, "").length >= minDigits, {
      message,
    }),
  );

const optionalEmail = optionalText(1000).refine(
  (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  { message: "E-mail inválido" },
);

const sexoField = requiredText("Sexo é obrigatório").refine(
  (value) => value === "Masculino" || value === "Feminino",
  { message: "Selecione uma opção válida para sexo" },
);

const dadosPessoaisSchema = z.object({
  nomeCompleto: requiredText("Nome completo é obrigatório", 1000),
  cpf: requiredDigits(11, "CPF inválido"),
  dataNascimento: requiredText("Data de nascimento é obrigatória"),
  sexo: sexoField,
  rg: requiredText("RG é obrigatório", 50),
  naturalidade: requiredText("Naturalidade é obrigatória", 191),
  situacaoConjugal: requiredText("Situação conjugal é obrigatória", 191),
  profissao: requiredText("Profissão é obrigatória", 191),
  telefone: requiredDigits(10, "Telefone inválido"),
  whatsapp: requiredDigits(10, "WhatsApp inválido"),
  email: requiredText("E-mail é obrigatório", 1000).refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    { message: "E-mail inválido" },
  ),
});

const enderecoSchema = z.object({
  cep: requiredDigits(8, "CEP é obrigatório"),
  uf: requiredText("UF é obrigatória", 1000),
  cidade: requiredText("Cidade é obrigatória", 1000),
  bairro: requiredText("Bairro é obrigatório", 1000),
  logradouro: requiredText("Logradouro é obrigatório", 1000),
  complemento: optionalText(1000),
  numero: requiredText("Número é obrigatório", 1000),
  pontoReferencia: requiredText("Ponto de referência é obrigatório", 255),
});

const responsavelFinanceiroSchema = z
  .object({
    usarMesmosDados: z.boolean(),
    nomeCompleto: optionalText(1000),
    cpf: optionalText(1000),
    rg: optionalText(50),
    dataNascimento: optionalText(10),
    sexo: optionalText(20).refine(
      (value) => !value || value === "Masculino" || value === "Feminino",
      { message: "Selecione uma opção válida para sexo" },
    ),
    naturalidade: optionalText(191),
    parentesco: optionalText(1000),
    email: optionalEmail,
    telefone: optionalText(1000),
    whatsapp: optionalText(1000),
    situacaoConjugal: optionalText(191),
    profissao: optionalText(191),
    cep: optionalText(20),
    uf: optionalText(5),
    cidade: optionalText(191),
    bairro: optionalText(191),
    logradouro: optionalText(191),
    complemento: optionalText(191),
    numero: optionalText(50),
    pontoReferencia: optionalText(255),
  })
  .superRefine((data, ctx) => {
    if (data.usarMesmosDados) return;

    const requiredFields: Array<{
      path:
        | "nomeCompleto"
        | "cpf"
        | "parentesco"
        | "sexo"
        | "naturalidade"
        | "situacaoConjugal"
        | "profissao"
        | "cep"
        | "uf"
        | "cidade"
        | "bairro"
        | "logradouro"
        | "numero"
        | "pontoReferencia"
        | "email"
        | "telefone"
        | "whatsapp";
      message: string;
      value?: string;
    }> = [
      {
        path: "nomeCompleto",
        message: "Nome completo do corresponsável é obrigatório",
        value: data.nomeCompleto,
      },
      {
        path: "cpf",
        message: "CPF do corresponsável é obrigatório",
        value: data.cpf,
      },
      {
        path: "parentesco",
        message: "Parentesco do corresponsável é obrigatório",
        value: data.parentesco,
      },
      {
        path: "sexo",
        message: "Sexo do corresponsável é obrigatório",
        value: data.sexo,
      },
      {
        path: "naturalidade",
        message: "Naturalidade do corresponsável é obrigatória",
        value: data.naturalidade,
      },
      {
        path: "situacaoConjugal",
        message: "Situação conjugal do corresponsável é obrigatória",
        value: data.situacaoConjugal,
      },
      {
        path: "profissao",
        message: "Profissão do corresponsável é obrigatória",
        value: data.profissao,
      },
      {
        path: "cep",
        message: "CEP do corresponsável é obrigatório",
        value: data.cep,
      },
      {
        path: "uf",
        message: "UF do corresponsável é obrigatória",
        value: data.uf,
      },
      {
        path: "cidade",
        message: "Cidade do corresponsável é obrigatória",
        value: data.cidade,
      },
      {
        path: "bairro",
        message: "Bairro do corresponsável é obrigatório",
        value: data.bairro,
      },
      {
        path: "logradouro",
        message: "Logradouro do corresponsável é obrigatório",
        value: data.logradouro,
      },
      {
        path: "numero",
        message: "Número do corresponsável é obrigatório",
        value: data.numero,
      },
      {
        path: "pontoReferencia",
        message: "Ponto de referência do corresponsável é obrigatório",
        value: data.pontoReferencia,
      },
      {
        path: "email",
        message: "E-mail do corresponsável é obrigatório",
        value: data.email,
      },
      {
        path: "telefone",
        message: "Telefone do corresponsável é obrigatório",
        value: data.telefone,
      },
      {
        path: "whatsapp",
        message: "WhatsApp do corresponsável é obrigatório",
        value: data.whatsapp,
      },
    ];

    requiredFields.forEach(({ path, message, value }) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [path],
        });
      }
    });

    if (data.cpf && data.cpf.replace(/\D/g, "").length < 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF do corresponsável inválido",
        path: ["cpf"],
      });
    }

    if (
      data.parentesco &&
      !RELATIONSHIP_OPTIONS.includes(data.parentesco as never)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um parentesco válido",
        path: ["parentesco"],
      });
    }

    if (data.cep && data.cep.replace(/\D/g, "").length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CEP do corresponsável inválido",
        path: ["cep"],
      });
    }

    if (data.telefone && data.telefone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefone do corresponsável inválido",
        path: ["telefone"],
      });
    }

    if (data.whatsapp && data.whatsapp.replace(/\D/g, "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WhatsApp do corresponsável inválido",
        path: ["whatsapp"],
      });
    }

    if (!data.dataNascimento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de nascimento do corresponsável é obrigatória",
        path: ["dataNascimento"],
      });
      return;
    }

    const idade = calcularIdade(data.dataNascimento);
    if (idade === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de nascimento do corresponsável inválida",
        path: ["dataNascimento"],
      });
      return;
    }

    if (idade < 18) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Corresponsável deve ser maior de idade (18+)",
        path: ["dataNascimento"],
      });
    }
  });

const dependentesSchema = z.object({
  dependentes: z.array(
    z.object({
      nome: requiredText("Nome é obrigatório", 1000),
      idade: requiredText("Idade é obrigatória", 3),
      parentesco: requiredText("Parentesco é obrigatório", 1000),
      telefone: requiredDigits(10, "Telefone é obrigatório"),
      cpf: requiredDigits(11, "CPF é obrigatório"),
    }),
  ),
});

export {
  dependentesSchema,
  enderecoSchema,
  dadosPessoaisSchema,
  responsavelFinanceiroSchema,
};
