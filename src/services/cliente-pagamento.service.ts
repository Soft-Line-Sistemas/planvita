import api from "@/utils/api";

export type MetodoPagamentoBillingType = "CREDIT_CARD" | "PIX" | "BOLETO";

export type CreditCardPayload = {
  holderName: string;
  holderCpf: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type AlterarPagamentoPayload =
  | {
      action: "ATUALIZAR_CARTAO";
      creditCard: CreditCardPayload;
    }
  | {
      action: "TROCAR_METODO";
      novoMetodo: MetodoPagamentoBillingType;
      creditCard?: CreditCardPayload;
    };

export type AlterarPagamentoResponse = {
  success: boolean;
  metodoPagamento: string;
};

export const alterarPagamentoCliente = async (
  payload: AlterarPagamentoPayload,
): Promise<AlterarPagamentoResponse> => {
  const { data } = await api.put<AlterarPagamentoResponse>(
    "/titular/me/pagamento",
    payload,
  );
  return data;
};
