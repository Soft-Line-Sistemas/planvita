import { describe, expect, it } from "vitest";
import { mapTitularToCarteirinha } from "./clienteCarteirinha.service";

describe("mapTitularToCarteirinha", () => {
  it("usa a data de ativação real da vigência após pagamento e assinaturas", () => {
    const cliente = mapTitularToCarteirinha({
      id: 956,
      nome: "Cliente Teste",
      cpf: "12345678901",
      statusPlano: "ATIVO",
      dataContratacao: "2026-06-27T23:26:36.593Z",
      pagamentoConfirmadoEm: "2026-06-27T23:29:48.312Z",
      assinaturas: [
        {
          tipo: "TITULAR_ASSINATURA_1",
          createdAt: "2026-06-29T13:02:00.853Z",
        },
        {
          tipo: "TITULAR_ASSINATURA_2",
          createdAt: "2026-06-29T13:03:03.590Z",
        },
        {
          tipo: "CORRESPONSAVEL_ASSINATURA_1",
          createdAt: "2026-06-29T13:03:09.836Z",
        },
        {
          tipo: "CORRESPONSAVEL_ASSINATURA_2",
          createdAt: "2026-06-29T13:03:17.503Z",
        },
      ],
      plano: {
        id: 1,
        nome: "Bosque Essencial",
        valorMensal: 100,
        vigenciaMeses: 60,
        coberturas: [{ descricao: "Benefícios complementares" }],
      },
    });

    expect(cliente.plano.ativadoEm).toBe("2026-06-29T13:03:17.503Z");
    expect(cliente.plano.vigencia.inicio).toBe("2026-06-29T13:03:17.503Z");
    expect(cliente.assinaturasPendentes).toBe(false);
    expect(cliente.plano.status).toBe("ativo");
  });
});
