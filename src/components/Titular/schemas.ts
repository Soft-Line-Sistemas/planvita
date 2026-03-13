import { z } from "zod";

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

const dadosPessoaisSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  dataNascimento: z.string().min(10, "Data de nascimento é obrigatória"),
  telefone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().min(11, "WhatsApp inválido"),
  email: z.string().email("E-mail inválido"),
});

const enderecoSchema = z.object({
  cep: z.string().min(8, "CEP é obrigatório"),
  uf: z.string().min(2, "UF é obrigatória"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  logradouro: z.string().min(2, "Logradouro é obrigatório"),
  complemento: z.string().optional(),
  numero: z.string().min(1, "Número é obrigatório"),
});

const responsavelFinanceiroSchema = z
  .object({
    usarMesmosDados: z.boolean(),
    nomeCompleto: z.string().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    dataNascimento: z.string().optional(),
    parentesco: z.string().optional(),
    email: z.string().optional(),
    telefone: z.string().optional(),
    whatsapp: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.usarMesmosDados) return true;
      return !!data.nomeCompleto && !!data.cpf && !!data.parentesco;
    },
    {
      message: "Preencha os campos obrigatórios ou marque 'Usar mesmos dados'",
      path: ["nomeCompleto"],
    },
  )
  .superRefine((data, ctx) => {
    if (data.usarMesmosDados) return;

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
      nome: z.string().min(2, "Nome é obrigatório"),
      idade: z.string().min(1, "Idade é obrigatória"),
      parentesco: z.string().min(1, "Parentesco é obrigatório"),
      telefone: z.string().min(10, "Telefone é obrigatório"),
      cpf: z.string().min(11, "CPF é obrigatório"),
    }),
  ),
});

export {
  dependentesSchema,
  enderecoSchema,
  dadosPessoaisSchema,
  responsavelFinanceiroSchema,
};
