RAMON EM 07/11/25
REFERENTE AO FINANCEIRO

Contas a Pagar

Representa tudo que sai do caixa (despesas, fornecedores, impostos etc.)

Campos essenciais
Campo	Tipo	Descrição
id_conta_pagar	inteiro (PK)	Identificador único da conta
fornecedor_id	FK	Relaciona com o fornecedor
data_emissao	data	Data do documento ou lançamento
data_vencimento	data	Quando o pagamento deve ocorrer
data_pagamento	data (nullable)	Quando foi realmente pago
valor_original	decimal	Valor do título
valor_pago	decimal (nullable)	Valor pago efetivamente
juros	decimal	Juros aplicados (se houver atraso)
multa	decimal	Multa por atraso
desconto	decimal	Desconto concedido
status	enum	(PENDENTE, PAGO, ATRASADO, CANCELADO)
forma_pagamento	enum	(PIX, Boleto, Transferência, Dinheiro, etc.)
categoria_id	FK	Relaciona com o plano de contas (ex: Despesa Fixa, Fornecedor, Impostos)
observacao	texto	Campo livre para notas internas
centro_custo_id	FK	Se houver divisão por áreas/departamentos
💵 Contas a Receber

Tudo que entra no caixa (clientes, vendas, assinaturas, etc.)

Campos essenciais
Campo	Tipo	Descrição
id_conta_receber	inteiro (PK)	Identificador único
cliente_id	FK	Relaciona com o cliente
data_emissao	data	Data do documento (ex: nota fiscal)
data_vencimento	data	Quando o cliente deve pagar
data_recebimento	data (nullable)	Quando o pagamento foi recebido
valor_original	decimal	Valor da venda
valor_recebido	decimal (nullable)	Valor efetivamente recebido
juros_recebido	decimal	Juros cobrados por atraso
desconto_concedido	decimal	Desconto dado ao cliente
status	enum	(PENDENTE, RECEBIDO, ATRASADO, CANCELADO)
forma_recebimento	enum	(PIX, Cartão, Dinheiro, Transferência, etc.)
categoria_id	FK	Ligação com o plano de contas (ex: Venda, Serviço, Aluguel etc.)
observacao	texto	Notas internas ou referências
centro_custo_id	FK	Caso tenha controle por áreas ou projetos
⚙️ Campos estratégicos (para um financeiro inteligente)

Esses campos elevam o nível do sistema:

Campo	Descrição
numero_documento / nota_fiscal	Integração contábil/fiscal
usuario_responsavel_id	Quem lançou a conta
origem_lancamento	Ex: “Compra de insumo”, “Venda sistema web”, etc.
repeticao_id / recorrencia_id	Para lançamentos mensais automáticos
anexo_documento	Upload de comprovante ou nota
conta_bancaria_id	Relacionamento com conta de origem/destino
projeto_id	Se houver controle de projetos
rateio	Distribuição do custo/receita entre centros de custo
saldo_atualizado	Atualização automática do caixa após cada operação
📊 Relacionamentos importantes

Fornecedor ↔ Contas a Pagar

Cliente ↔ Contas a Receber

Categoria (Plano de Contas) para classificação contábil

Centro de Custo / Projeto para análises gerenciais

Conta Bancária / Caixa para integração com fluxo de caixa