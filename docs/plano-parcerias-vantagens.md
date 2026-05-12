# Plano frontend: Parcerias e vantagens

## Objetivo

Implementar a experiencia de Parcerias e vantagens no frontend, usando o que ja esta visivel no mobile de `/cliente` e no cadastro mobile, mas conectando a dados reais do backend.

O desktop atual de `/cliente` continua preservado. A funcionalidade nova entra principalmente no mobile do cliente, no cadastro publico mobile e no painel administrativo para gestao do catalogo.

## Estado atual identificado

- `frontend/src/features/cliente/mobile/screens/HomeScreen.tsx` ja tem o card `Parcerias e vantagens`.
- `frontend/src/features/cliente/mobile/screens/ParceriasScreen.tsx` existe, mas esta como placeholder "Em breve".
- `frontend/src/features/cliente/mobile/MobileCadastroScreen.tsx` ja apresenta `Clube de beneficios` na etapa de servicos adicionais.
- O CSS mobile esta concentrado em `frontend/src/app/styles/cliente-mobile.css`, com classes prefixadas por `cm-`.
- O cliente mobile ja usa services reais para auth, faturas, assinaturas e ajustes via `frontend/src/services`.
- O painel administrativo tem padrao de paginas em `/painel/gestao/*` e menu em `frontend/src/components/Sidebar.tsx`.

## Escopo do MVP

1. Cliente mobile autenticado lista vantagens reais.
2. Cliente mobile filtra por categoria e busca por texto.
3. Cliente abre detalhe de uma vantagem e executa uma acao: copiar cupom, abrir link, abrir WhatsApp ou ler instrucoes.
4. Cadastro publico mobile mostra uma previa curta do Clube de beneficios, sem depender de login.
5. Painel administrativo gerencia categorias, parceiros e vantagens.

Fora do MVP:

- geolocalizacao;
- favoritos;
- avaliacao de parceiros;
- cupom unico por cliente;
- area do parceiro.

## Arquitetura proposta

Criar tipos e services dedicados:

```text
frontend/src/types/Parcerias.ts
frontend/src/services/parcerias.service.ts
```

Criar ou evoluir componentes mobile:

```text
frontend/src/features/cliente/mobile/screens/ParceriasScreen.tsx
frontend/src/features/cliente/mobile/components/ParceriaCard.tsx
frontend/src/features/cliente/mobile/components/ParceriaDetalheSheet.tsx
frontend/src/features/cliente/mobile/components/ParceriasCategoriaChips.tsx
```

Criar backoffice:

```text
frontend/src/app/painel/gestao/parcerias/page.tsx
frontend/src/components/Parcerias/ParceriasCategoriasPanel.tsx
frontend/src/components/Parcerias/ParceirosPanel.tsx
frontend/src/components/Parcerias/VantagensPanel.tsx
frontend/src/components/Parcerias/VantagemFormDialog.tsx
```

Evitar misturar esse dominio com `PlanType.Beneficio`. O beneficio do plano continua sendo usado para contrato/cobertura; parcerias entram em tipos novos.

## Contrato esperado de dados

Tipos principais:

```ts
export type ParceriaCategoria = {
  id: number;
  nome: string;
  slug: string;
  icone?: string | null;
};

export type ParceriaParceiroResumo = {
  id: number;
  nome: string;
  slug: string;
  logoUrl?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export type ParceriaVantagemResumo = {
  id: number;
  slug: string;
  titulo: string;
  descricaoCurta?: string | null;
  tipo: string;
  valorDesconto?: number | null;
  validadeFim?: string | null;
  destaque: boolean;
  elegivel: boolean;
  motivoBloqueio?: string | null;
  categoria?: ParceriaCategoria | null;
  parceiro: ParceriaParceiroResumo;
};

export type ParceriaVantagemDetalhe = ParceriaVantagemResumo & {
  descricaoCompleta?: string | null;
  regrasUso?: string | null;
  instrucoesResgate?: string | null;
  codigoCupom?: string | null;
  linkResgate?: string | null;
  whatsapp?: string | null;
};
```

Service:

```ts
listarCategoriasCliente(): Promise<ParceriaCategoria[]>
listarVantagensCliente(params): Promise<ParceriaVantagemResumo[]>
obterVantagemCliente(slug): Promise<ParceriaVantagemDetalhe>
registrarResgate(vantagemId, canal): Promise<void>
listarVantagensPublicas(params): Promise<ParceriaVantagemResumo[]>
```

Rotas admin no mesmo service ou em `parcerias-admin.service.ts`:

```ts
listarCategoriasAdmin()
salvarCategoria()
listarParceirosAdmin()
salvarParceiro()
listarVantagensAdmin()
salvarVantagem()
alterarStatusVantagem()
```

## Experiencia mobile autenticada

Substituir o placeholder de `ParceriasScreen` por uma tela funcional.

Estrutura visual:

- header com voltar, mantendo `cm-app-header`;
- campo de busca compacto;
- chips de categoria horizontais;
- bloco de destaques;
- lista de vantagens;
- bottom tab bar continua ativa como hoje, com a aba `Início` marcada;
- estados de loading, erro, vazio e sem elegibilidade.

Card de vantagem:

- logo ou inicial do parceiro;
- nome do parceiro;
- titulo da vantagem;
- descricao curta;
- badge do tipo de desconto;
- validade quando houver;
- indicador `Disponivel para seu plano` ou motivo bloqueado;
- CTA `Ver vantagem`.

Detalhe:

- abrir como bottom sheet ou tela interna dentro de `ParceriasScreen`;
- mostrar parceiro, descricao completa, regras e instrucoes;
- se tiver `codigoCupom`, botao para copiar;
- se tiver `linkResgate`, botao para abrir em nova aba;
- se tiver WhatsApp, botao para abrir conversa;
- chamar `registrarResgate` antes da acao quando a rota existir;
- bloquear CTA quando `elegivel = false`.

## Cadastro publico mobile

Na etapa `Servicos adicionais`, manter o item `Clube de beneficios`, mas enriquecer a tela com previa real:

- consultar `listarVantagensPublicas({ limit: 3 })`;
- mostrar ate 3 exemplos curtos abaixo do card do clube;
- nao expor cupom nem link restrito nessa tela;
- se a API falhar, manter o texto atual sem bloquear cadastro;
- nao alterar payload do cadastro ate o backend decidir persistir servicos adicionais.

Quando o produto decidir que `Clube de beneficios` afeta elegibilidade, adicionar persistencia explicita no cadastro. Ate la, elegibilidade deve depender de plano/status ou regras cadastradas na vantagem.

## Painel administrativo

Adicionar item no menu:

```text
Parcerias
href: /painel/gestao/parcerias
permissao: parcerias.view
icone sugerido: Handshake ou BadgePercent
```

Pagina admin proposta:

- abas `Vantagens`, `Parceiros`, `Categorias`;
- tabela com busca, filtro de status e filtro de categoria;
- botao `Nova vantagem`;
- dialog de formulario com validacao local;
- acoes de publicar/pausar/editar;
- destaque visual para vantagens expiradas;
- confirmacao antes de remover ou pausar.

Campos do formulario de vantagem:

- parceiro;
- categoria;
- titulo;
- descricao curta;
- descricao completa;
- tipo;
- valor do desconto;
- validade inicial/final;
- publico: `PUBLICO`, `CLIENTES_ATIVOS`, `PLANOS_ESPECIFICOS`;
- planos aplicaveis quando for `PLANOS_ESPECIFICOS`;
- codigo de cupom;
- link de resgate;
- instrucoes e regras de uso;
- destaque;
- status.

Para imagens, usar inicialmente campos de URL (`logoUrl`, `bannerUrl`). Upload pode entrar depois se o backend padronizar storage para esse dominio.

## Estados e cache

Usar React Query:

```text
["parcerias", "cliente", "categorias"]
["parcerias", "cliente", "vantagens", filtros]
["parcerias", "cliente", "vantagem", slug]
["parcerias", "public", "vantagens"]
["parcerias", "admin", "vantagens", filtros]
```

Invalidar listas admin apos criar, atualizar, publicar ou pausar. No mobile, usar `staleTime` moderado, por exemplo 5 minutos, porque o catalogo nao muda a cada navegacao.

## Ordem de implementacao frontend

1. Criar tipos e service de parcerias.
2. Implementar tela mobile autenticada consumindo endpoints cliente.
3. Implementar detalhe e acoes de cupom/link/WhatsApp.
4. Enriquecer o cadastro mobile com previa publica.
5. Criar pagina admin de parcerias e adicionar item no sidebar.
6. Conectar formularios admin aos endpoints de backoffice.
7. Ajustar CSS em `cliente-mobile.css`, mantendo prefixo `cm-` e sem impacto no desktop.
8. Rodar lint/build e validar fluxos mobile.

## Criterios de aceite frontend

- O card atual de `Parcerias e vantagens` abre uma lista real no mobile.
- A tela nao mostra mais "Em breve" quando a API responde.
- Busca e filtro por categoria funcionam.
- Cupom pode ser copiado e link externo/WhatsApp abre corretamente.
- Cliente sem elegibilidade nao recebe cupom/link restrito.
- Cadastro mobile mostra previa de vantagens sem quebrar o fluxo se a API falhar.
- Admin consegue criar, editar, publicar e pausar vantagens.
- Nenhum service do mobile chama rotas administrativas.
- `/cliente` desktop permanece com comportamento atual.

## Validacao recomendada

```bash
cd frontend
npm run lint
npm run build
```

Validar manualmente:

- `/cliente` mobile autenticado em `390x844` e `440x956`;
- abrir Parcerias sem dados, com dados, com erro de API e com vantagens bloqueadas;
- copiar cupom;
- abrir link de resgate;
- abrir cadastro mobile e confirmar previa publica;
- abrir painel em desktop e gerenciar uma vantagem;
- abrir `/cliente` desktop e confirmar que nada mudou.
