// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ConfiguracoesPage from "./page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/utils/api", () => ({
  default: apiMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { tenant: "tenant-auth" },
  }),
}));

const baseConfig = {
  tenantId: "tenant-123",
  diasAvisoVencimento: 2,
  diasAvisoPendencia: 1,
  repeticaoPendenciaDias: 5,
  diasSuspensaoPreventiva: 85,
  diasSuspensao: 90,
  diasPosSuspensao: 92,
  avisoReajusteAnual: true,
  avisoRenovacaoAutomatica: false,
  textoSuspensaoPreventiva: "",
  textoSuspensao: "",
  textoPosSuspensao: "",
  permitirEstoqueNegativo: false,
  notificarEstoqueBaixo: false,
  limiteBeneficiarios: 5,
  valorAdicionalDependenteForaGrade: 14.9,
  valorAdicionalDependenteForaGradeFaixasJson:
    '[{"idadeMaxima":17,"valor":12.5},{"idadeMaxima":null,"valor":30}]',
  quilometragemMaxVeiculo: 100000,
  notificarManutencao: false,
  prazoReserva: 30,
  notificarTaxaVencida: false,
  redirecionamentoWhatsappAtivo: true,
  redirecionamentoWhatsappNumero: "67999990000",
  redirecionamentoWhatsappIdadeMin: 18,
  redirecionamentoWhatsappIdadeMax: 65,
  ativo: true,
};

const getInputFromLabel = (labelText: string, index = 0) => {
  const labels = screen.getAllByText(labelText);
  const container = labels[index]?.parentElement;
  const input = container?.querySelector("input");
  if (!input) {
    throw new Error(`Input não encontrado para o rótulo: ${labelText}`);
  }
  return input as HTMLInputElement;
};

describe("/painel/configuracoes", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({ data: [baseConfig] });
    apiMock.put.mockResolvedValue({ data: {} });
    apiMock.post.mockResolvedValue({ data: {} });
    vi.stubGlobal("alert", vi.fn());
  });

  it("carrega os campos existentes e salva via PUT com payload normalizado", async () => {
    const user = userEvent.setup();

    render(React.createElement(ConfiguracoesPage));

    expect(
      await screen.findByText("Configurações de Regras de Negócio"),
    ).toBeInTheDocument();
    expect(getInputFromLabel("Dias para aviso de vencimento").value).toBe("2");
    expect(getInputFromLabel("Número de WhatsApp").value).toBe(
      "(67) 99999-0000",
    );

    const limiteBeneficiarios = getInputFromLabel("Limite de beneficiários");
    fireEvent.change(limiteBeneficiarios, { target: { value: "8" } });

    const whatsapp = getInputFromLabel("Número de WhatsApp");
    await user.clear(whatsapp);
    await user.type(whatsapp, "71988887777");

    const idadeMinima = getInputFromLabel("Idade mínima (anos)");
    fireEvent.change(idadeMinima, { target: { value: "21" } });

    const valorFallback = getInputFromLabel(
      "Valor fixo (fallback — usado quando não há faixas configuradas) (R$)",
    );
    fireEvent.change(valorFallback, { target: { value: "19.9" } });

    const faixaValorInputs = screen.getAllByPlaceholderText("Valor");
    fireEvent.change(faixaValorInputs[0], { target: { value: "25" } });
    fireEvent.change(faixaValorInputs[1], { target: { value: "0" } });

    await user.click(
      screen.getAllByRole("button", { name: "Salvar Regras de Negócio" })[0],
    );

    await waitFor(() => {
      expect(apiMock.put).toHaveBeenCalledTimes(1);
    });

    expect(apiMock.put).toHaveBeenCalledWith(
      "/regras/tenant-123",
      expect.objectContaining({
        tenantId: "tenant-123",
        limiteBeneficiarios: 8,
        valorAdicionalDependenteForaGrade: 19.9,
        redirecionamentoWhatsappNumero: "71988887777",
        redirecionamentoWhatsappIdadeMin: 21,
        valorAdicionalDependenteForaGradeFaixasJson:
          '[{"idadeMaxima":17,"valor":25}]',
      }),
    );
    expect(globalThis.alert).toHaveBeenCalledWith(
      "Regras de negócio salvas com sucesso!",
    );
  });

  it("cria regra nova via POST usando o tenant do usuário quando não existe tenantId", async () => {
    const user = userEvent.setup();
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          ...baseConfig,
          tenantId: "",
          valorAdicionalDependenteForaGradeFaixasJson: null,
        },
      ],
    });

    render(React.createElement(ConfiguracoesPage));

    expect(
      await screen.findByText("Configurações de Regras de Negócio"),
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "+ Adicionar faixa etária" })[0],
    );

    const faixaValorInputs = screen.getAllByPlaceholderText("Valor");

    await user.clear(faixaValorInputs[0]);
    await user.type(faixaValorInputs[0], "18.75");

    await user.click(
      screen.getAllByRole("button", { name: "Salvar Regras de Negócio" })[0],
    );

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledTimes(1);
    });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/regras",
      expect.objectContaining({
        tenantId: "tenant-auth",
        valorAdicionalDependenteForaGradeFaixasJson:
          '[{"idadeMaxima":null,"valor":18.75}]',
      }),
    );
  });
});
