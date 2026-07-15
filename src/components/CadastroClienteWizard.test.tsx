// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CadastroClienteWizard } from "./CadastroClienteWizard";

const { apiMock, mutateAsyncMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
  },
  mutateAsyncMock: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("@/utils/api", () => ({
  default: apiMock,
}));

vi.mock("@/hooks/mutations/useCreateTitular", () => ({
  useCreateTitular: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("react-hook-form", () => ({
  useForm: () => ({
    trigger: vi.fn().mockResolvedValue(true),
    getValues: vi.fn((field?: string) => {
      const values = {
        nomeCompleto: "Cliente Teste",
        email: "cliente@teste.com",
        cpf: "12345678901",
        dataNascimento: "1990-01-01",
        parentesco: "Outro",
        planoId: 10,
        plano: { id: 10, nome: "Plano App", valorMensal: 99.9 },
      } as Record<string, unknown>;

      if (field) return values[field];
      return values;
    }),
  }),
}));

vi.mock("@/components/Titular/DadosPessoaisForm", () => ({
  DadosPessoaisForm: () => <div>Step Dados Pessoais</div>,
}));

vi.mock("@/components/Titular/EnderecoForm", () => ({
  EnderecoForm: () => <div>Step Endereco</div>,
}));

vi.mock("@/components/Titular/ResponsavelFinanceiroForm", () => ({
  ResponsavelFinanceiroForm: () => <div>Step Responsavel</div>,
}));

vi.mock("@/components/Titular/DependentesForm", () => ({
  DependentesForm: () => <div>Step Dependentes</div>,
}));

vi.mock("@/components/Titular/PlanoForm", () => ({
  PlanoForm: () => <div>Step Plano</div>,
}));

vi.mock("@/components/Titular/Confirmacao", () => ({
  Confirmacao: ({
    selectedConsultorKey,
    isConsultorLocked,
    consultorError,
  }: {
    selectedConsultorKey?: string;
    isConsultorLocked?: boolean;
    consultorError?: string | null;
  }) => (
    <div>
      <div data-testid="selected-consultor-key">
        {selectedConsultorKey ?? "sem-consultor"}
      </div>
      <div data-testid="consultor-locked">
        {isConsultorLocked ? "locked" : "unlocked"}
      </div>
      {consultorError && <div>{consultorError}</div>}
      <div>Step Confirmacao</div>
    </div>
  ),
}));

describe("CadastroClienteWizard consultor link flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/consultor/public") {
        return Promise.resolve({
          data: [
            {
              id: 1,
              nome: "Ana (Unidade A)",
              tenantId: "tenant-a",
              tenantLabel: "Unidade A",
              selectionKey: "tenant-a:1",
            },
            {
              id: 2,
              nome: "Bruno (Unidade B)",
              tenantId: "tenant-b",
              tenantLabel: "Unidade B",
              selectionKey: "tenant-b:2",
            },
          ],
        });
      }

      if (url === "/regras") {
        return Promise.resolve({
          data: [{ limiteBeneficiarios: 5 }],
        });
      }

      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    mutateAsyncMock.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("carrega consultores globais e bloqueia a selecao quando o link traz consultorId e consultorTenant", async () => {
    window.history.pushState(
      {},
      "",
      "/cadastro?consultorId=2&consultorTenant=tenant-b",
    );
    const user = userEvent.setup();

    render(<CadastroClienteWizard variant="public" />);

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith("/consultor/public");
    });

    for (let step = 0; step < 5; step += 1) {
      await user.click(screen.getByRole("button", { name: /continuar/i }));
    }

    expect(await screen.findByText("Step Confirmacao")).toBeInTheDocument();
    expect(screen.getByTestId("selected-consultor-key")).toHaveTextContent(
      "tenant-b:2",
    );
    expect(screen.getByTestId("consultor-locked")).toHaveTextContent("locked");
  });

  it("envia o cadastro final com consultor e tenant herdados do link atual", async () => {
    window.history.pushState(
      {},
      "",
      "/cadastro?consultorId=2&consultorTenant=tenant-b",
    );
    const user = userEvent.setup();

    render(<CadastroClienteWizard variant="public" />);

    for (let step = 0; step < 5; step += 1) {
      await user.click(
        await screen.findByRole("button", { name: /continuar/i }),
      );
    }

    await user.click(
      await screen.findByRole("button", { name: /finalizar cadastro/i }),
    );

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        consultorId: 2,
        consultorTenantId: "tenant-b",
        targetTenantId: "tenant-b",
      }),
    );
  });
});
