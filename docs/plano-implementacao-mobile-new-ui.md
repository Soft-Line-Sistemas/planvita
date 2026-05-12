# Plano de implementação: `/cliente` mobile com design do `new-ui`

## Objetivo

Aplicar o novo design mobile criado em `planvita/new-ui` na área pública do cliente em `planvita/frontend`, sem alterar a experiência atual de desktop/PC do `/cliente`.

O desktop deve continuar usando a implementação atual de `frontend/src/app/cliente/page.tsx`. A versão mobile deve reaproveitar a lógica já existente de autenticação, primeiro acesso, recuperação de senha, consulta do titular, carteirinha, financeiro, assinatura digital, cadastro público e seleção de tenant, trocando a camada visual e de navegação para seguir as telas do `new-ui`.

## Estado atual identificado

- O `/cliente` atual está concentrado em `frontend/src/app/cliente/page.tsx`.
- A página atual já contém a maior parte da regra funcional:
  - login por CPF/e-mail e senha em `/auth/login` com `audience: "cliente"`;
  - primeiro acesso em `/auth/first-access` + `/auth/verify`;
  - recuperação em `/auth/forgot-password`, `/auth/verify`, `/auth/reset-password`;
  - sessão do cliente via `/titular/me`;
  - busca pública legada via `/titular/public/search`;
  - dados de carteirinha por `mapTitularToCarteirinha`;
  - financeiro por `listarContasDoCliente`;
  - assinaturas por `listarAssinaturas` e `salvarAssinatura`;
  - regras de suspensão por `/regras`.
- O cadastro público atual está em `frontend/src/app/cliente/cadastro/page.tsx` e usa `CadastroClienteWizard` com `variant="public"`.
- O `new-ui` contém telas mobile de referência em `new-ui/lib/figma-screens.ts` e uma implementação visual/mockada em:
  - `new-ui/components/FigmaFlowApp.tsx`;
  - `new-ui/components/figma/createFigmaReplaceNode.tsx`;
  - `new-ui/components/cliente/ClienteMirrorApp.tsx`;
  - `new-ui/components/cliente/cliente-app-screens.css`;
  - assets em `new-ui/public/icons`, `new-ui/public/images` e `new-ui/public/layers`.

## Regra principal de compatibilidade

Usar a versão nova apenas quando `window.matchMedia("(max-width: 767px)")` for verdadeira. Para `768px` ou mais, manter a UI atual.

Implementação sugerida:

- Preservar a página desktop em um componente dedicado, por exemplo `ClienteDesktopPage`.
- Criar um componente de roteamento responsivo em `frontend/src/app/cliente/page.tsx`.
- Usar o hook existente `frontend/src/hooks/use-mobile.ts`.
- Enquanto o breakpoint ainda não foi resolvido no cliente, renderizar um estado neutro leve para evitar duplicar chamadas de API.

## Arquitetura frontend proposta

Criar um módulo mobile isolado:

```text
frontend/src/features/cliente/
  shared/
    cliente-formatters.ts
    cliente-validators.ts
    useClientePortal.ts
    useClienteAuthFlows.ts
    useClienteFinanceiro.ts
    useClienteAssinaturas.ts
  desktop/
    ClienteDesktopPage.tsx
  mobile/
    ClienteMobilePage.tsx
    ClienteMobileShell.tsx
    ClienteMobileTabBar.tsx
    ClienteMobileHeader.tsx
    ClienteMobileLogin.tsx
    ClienteMobileFirstAccessDialog.tsx
    ClienteMobileForgotPasswordDialog.tsx
    ClienteMobileHome.tsx
    ClienteMobileCarteirinha.tsx
    ClienteMobileFaturas.tsx
    ClienteMobileAtendimento.tsx
    ClienteMobileAssinaturas.tsx
    ClienteMobileAjustes.tsx
    ClienteMobileAlterarSenha.tsx
    ClienteMobileAlterarFoto.tsx
    ClienteMobileEntendaPlano.tsx
    ClienteMobileCadastro.tsx
    cliente-mobile.css
```

O ponto importante é extrair a lógica antes de redesenhar. O arquivo atual `page.tsx` mistura regra e visual; copiar esse arquivo para mobile manteria alto risco de regressão. A primeira etapa deve ser mover funções e hooks para `shared/`, mantendo o desktop igual visualmente.

## Assets e estilo

Copiar somente os assets necessários do `new-ui` para uma pasta pública estável no frontend:

```text
frontend/public/cliente-mobile/icons
frontend/public/cliente-mobile/images
```

Não depender de caminhos como `/icons/...` que hoje existem apenas no `new-ui`. No frontend final, usar `/cliente-mobile/icons/...`.

Usar `new-ui/components/cliente/cliente-app-screens.css` como base visual para as telas autenticadas, mas revisar nomes e escopo:

- todos os seletores devem ficar sob `.cliente-mobile-root`;
- nada deve alterar `html`, `body`, `main` global ou componentes desktop;
- manter safe-area com `env(safe-area-inset-*)`;
- fixar bottom nav com altura estável;
- evitar renderizar a UI como artboard absoluto do Figma, exceto como referência visual.

## Mapeamento de telas

| Tela `new-ui` | Rota/estado final | Fonte de dados real |
| --- | --- | --- |
| `splash`, `splash-v2`, `carrossel` | onboarding local mobile antes do login | `localStorage` para marcar visto, sem backend |
| `login-1` | estado não autenticado de `/cliente` | `/auth/login`, `/auth/first-access`, `/auth/forgot-password` |
| `login-2`, `login-3`, `login-4` | primeiro acesso/recuperação em modal ou telas sequenciais | `/auth/first-access`, `/auth/verify`, `/auth/reset-password` |
| `home` | dashboard mobile autenticado | `/titular/me`, `/regras`, hooks financeiros |
| `carteirinha-digital` | carteirinha mobile | `ClientePlano` vindo de `mapTitularToCarteirinha` |
| `fatura` | faturas mobile | novo endpoint cliente no backend, ver plano backend |
| `atendimento` | atendimento mobile | configuração estática inicial ou futura configuração por tenant |
| `assinaturas` | assinaturas mobile | novos endpoints cliente no backend, ver plano backend |
| `ajustes` | ajustes mobile | logout, alteração de senha, alteração de foto conforme plano específico |
| `alterar-senha` | troca de senha autenticada | novo endpoint backend |
| `alterar-foto-de-perfil` | upload/preview de foto | ver `frontend/docs/plano-foto-perfil-cliente-mobile.md` |
| `cadastro`, `cadastro-1`, `dependentes`, `planos`, `forma-pagamento`, `forma-pagamento-1`, `entenda-seu-plano` | cadastro público mobile | lógica do `CadastroClienteWizard` e `useCreateTitular` |

## Etapas de implementação frontend

### Fase 1: preparação segura

1. Copiar a implementação atual de `frontend/src/app/cliente/page.tsx` para `features/cliente/desktop/ClienteDesktopPage.tsx`.
2. Trocar `frontend/src/app/cliente/page.tsx` para um componente fino que escolhe desktop ou mobile.
3. Extrair helpers puros do arquivo atual:
   - `normalizeCpf`;
   - `validateCPF`;
   - `validatePassword`;
   - `formatCurrency`;
   - `formatDate`;
   - `buildClienteUrlByUnidade`;
   - `getSubdomainFromCurrentHost`.
4. Garantir que o desktop continue visualmente igual após a extração.

### Fase 2: estado compartilhado do portal

Criar hooks compartilhados e substituir o estado direto do desktop por esses hooks gradualmente:

- `useClienteAuthFlows`: login, logout, primeiro acesso, recuperação, query params `modo`, `login`, `token`, `tenant`.
- `useClientePortal`: cliente autenticado, seleção de tenant, carregamento de `/titular/me`, busca legada por CPF.
- `useClienteFinanceiro`: contas, filtros, status, PIX, regra de suspensão.
- `useClienteAssinaturas`: listagem, salvamento, URLs de preview/download.

Esses hooks devem ser usados por desktop e mobile para impedir divergência de comportamento.

### Fase 3: shell mobile

Criar o shell base conforme `ClienteMirrorApp`:

- gradiente verde superior;
- cards brancos com raio e espaçamento do `new-ui`;
- header mobile com voltar;
- bottom tab bar com `Início`, `Atendimento`, `Faturas`, `Ajustes`;
- navegação por estado interno, não por rotas adicionais obrigatórias.

Estados principais:

```ts
type ClienteMobileScreen =
  | "login"
  | "home"
  | "carteirinha"
  | "faturas"
  | "atendimento"
  | "assinaturas"
  | "ajustes"
  | "alterar-senha"
  | "alterar-foto"
  | "entenda-plano"
  | "cadastro";
```

### Fase 4: login, primeiro acesso e recuperação

Implementar `ClienteMobileLogin` seguindo visual de `login-1`, mas com a lógica real do `/cliente` atual:

- CPF/e-mail;
- senha;
- entrar;
- primeiro acesso/criar senha;
- esqueci minha senha;
- redirecionamento para cadastro quando backend retornar `FIRST_ACCESS_CONTACT_REQUIRED`, `404` ou `Cliente não encontrado.`;
- suporte aos links com `?modo=primeiro-acesso&token=...` e `?modo=reset&token=...`.

Não remover o `ENABLE_LEGACY_QUICK_ACCESS`; se ainda for necessário, manter escondido no mobile ou acessível em uma ação secundária.

### Fase 5: home e carteirinha

Implementar `ClienteMobileHome` com dados reais:

- nome curto do titular;
- nome completo;
- CPF mascarado ou completo conforme regra atual do produto;
- plano;
- validade/vigência;
- avatar com fallback por inicial;
- CTA para carteirinha;
- cards para contrato, faturas, parcerias e assinaturas;
- banner de atendimento.

Implementar `ClienteMobileCarteirinha` reaproveitando `CarteirinhaAsImage` inicialmente. Se o design vertical do `new-ui` for obrigatório, criar um componente novo que use o mesmo `ClientePlano` e mantenha ações de baixar PDF/ver benefícios.

### Fase 6: faturas

Trocar a tabela desktop por cards mobile conforme `new-ui`:

- título/descrição;
- vencimento;
- valor;
- badge `Atual`, `Vencido`, `Pago`;
- ação principal `Pagar`, `Ver recibo`;
- ação PIX quando houver `pixQrCode`;
- modal de QR code/copia e cola reaproveitando a lógica atual.

Usar endpoint cliente seguro definido no plano backend. Não depender de `/financeiro/contas` filtrado no navegador.

### Fase 7: assinaturas

Criar UI mobile baseada na tela `Assinaturas`:

- card de contrato;
- etapas sequenciais de assinatura;
- botão `Assinar agora`;
- preview/download quando concluída;
- captura via `SignaturePad`, com área maior e adaptada ao toque.

Usar endpoints cliente com `cliente_token` e sem `titularId` na URL pública sempre que possível.

### Fase 8: ajustes

Implementar:

- logout;
- alterar senha com senha atual, nova senha e confirmação;
- alterar foto seguindo `frontend/docs/plano-foto-perfil-cliente-mobile.md`: backend autenticado, leitura segura em `/titular/me`, upload real e fallback por inicial.

### Fase 9: cadastro público mobile

Reutilizar a lógica do `CadastroClienteWizard`, mas trocar a apresentação quando o viewport for mobile:

- preservar schemas de `frontend/src/components/Titular/schemas.ts`;
- preservar `useCreateTitular({ variant: "public" })`;
- preservar regras de dependente e limite de beneficiários;
- adaptar visual para a sequência do `new-ui`:
  - `cadastro`;
  - `cadastro-1`;
  - `dependentes`;
  - `planos`;
  - `forma-pagamento`;
  - `forma-pagamento-1`;
  - conclusão com redirecionamento para primeiro acesso.

Não criar um fluxo paralelo que envie payload diferente para o backend.

## Critérios de aceite frontend

- Em desktop, `/cliente` mantém a UI e comportamento atuais.
- Em mobile, `/cliente` usa o visual do `new-ui` e não mostra a página desktop responsiva antiga.
- Login real funciona por CPF/e-mail.
- Primeiro acesso e recuperação funcionam por OTP e links com token.
- Home mobile mostra dados reais do titular autenticado.
- Carteirinha, contrato/plano, dependentes, faturas e assinaturas não usam dados mockados.
- Faturas usam endpoint restrito ao cliente autenticado.
- Assinaturas usam endpoint restrito ao cliente autenticado.
- Cadastro público mobile usa as mesmas validações e payload do cadastro atual.
- Nenhum CSS mobile afeta `/painel`, `/login`, `/cadastro` ou `/cliente` desktop.

## Validação recomendada

Executar:

```bash
cd frontend
npm run lint
npm run build
```

Validar manualmente com Playwright ou navegador:

- `390x844`;
- `440x956`;
- `768x1024`;
- `1366x768`.

Fluxos mínimos:

- abrir `/cliente` deslogado no mobile;
- login com usuário cliente;
- logout;
- primeiro acesso;
- recuperação de senha;
- abrir faturas e copiar PIX;
- salvar assinatura;
- abrir `/cliente` no desktop e confirmar que a UI antiga permanece;
- abrir `/cliente/cadastro` no mobile e concluir cadastro até o redirecionamento de primeiro acesso.

## Riscos e decisões pendentes

- O `new-ui` tem muitos dados hardcoded; usar como referência visual, não como fonte funcional.
- As telas de foto de perfil exigem persistência. O caminho recomendado está em `frontend/docs/plano-foto-perfil-cliente-mobile.md` e usa `Documento` com `tipoDocumento = "FOTO_PERFIL"` em vez de campo direto no `Titular`.
- O endpoint atual de assinaturas exige autenticação de backoffice; mobile precisa de rota cliente.
- O endpoint atual de financeiro lista contas de forma ampla e o filtro é feito no frontend; mobile deve usar endpoint cliente seguro.
- Definir se onboarding `splash/carrossel` sempre aparece ou apenas na primeira visita por `localStorage`.
