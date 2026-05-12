# Plano: foto de perfil no `/cliente` mobile

## Objetivo

Avaliar e planejar a implementação persistente da foto de perfil exibida no design mobile do `/cliente`.

A tela mobile já prevê a ação em `Ajustes > Alterar foto de Perfil` e a home já possui área visual para avatar. A decisão técnica é transformar esse ponto visual em funcionalidade real, preservando a versão desktop atual e mantendo a foto restrita ao cliente autenticado.

## Viabilidade

A implementação é viável com baixo impacto de banco, porque o backend já tem uma base parcial:

- `POST /api/:version/titular/me/foto` em `backend/src/routes/titular.routes.ts`;
- `DELETE /api/:version/titular/me/foto` em `backend/src/routes/titular.routes.ts`;
- `TitularController.uploadFotoPerfilMe` e `TitularController.deleteFotoPerfilMe`;
- `TitularService.salvarFotoPerfil` e `TitularService.removerFotoPerfil`;
- persistência via `Documento` com `tipoDocumento = "FOTO_PERFIL"`;
- upload para a Files API reaproveitando o fluxo usado por assinaturas;
- service frontend criado em `frontend/src/services/cliente-ajustes.service.ts`.

O que ainda falta é ligar o ciclo completo de leitura, exibição e edição no frontend mobile. Hoje o modal da tela de ajustes mostra mensagem de funcionalidade futura, e a home usa apenas a inicial do nome.

## Estado atual identificado

### Backend

O backend já aceita upload em base64 com:

```ts
{
  imageBase64: string;
  filename?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
}
```

Regras atuais:

- autenticação por `authenticateCliente`;
- titular resolvido por `req.cliente.titularId`;
- limite de 5 MB;
- formatos aceitos: PNG, JPEG e WebP;
- criação ou atualização de um documento `FOTO_PERFIL`;
- remoção por `deleteMany` dos documentos `FOTO_PERFIL` do titular.

Pontos pendentes:

- `/titular/me` não expõe `fotoPerfilUrl`;
- `Documento` guarda `arquivoUrl`, mas não guarda `arquivoId`, `mimetype` ou `size`;
- a remoção apaga o registro no banco, mas não há limpeza explícita do arquivo na Files API;
- os erros internos ainda usam textos genéricos herdados do fluxo de assinatura em alguns helpers;
- não há testes específicos para upload, troca e remoção da foto.

### Frontend

Já existe:

- `AjustesScreen` com modal de alteração de foto;
- `cliente-ajustes.service.ts` com `salvarFotoPerfilCliente` e `removerFotoPerfilCliente`;
- card da home com avatar e ícone de edição;
- CSS mobile alinhado ao `new-ui`.

Pontos pendentes:

- `ClientePlano` não tem `fotoPerfilUrl`;
- `mapTitularToCarteirinha` não mapeia foto do payload do titular;
- `HomeScreen` não renderiza imagem real;
- `AjustesScreen` não abre galeria/câmera, não envia upload e não atualiza estado local;
- não existe feedback completo de carregando, erro, sucesso e remoção.

## Decisão recomendada

Implementar foto persistente usando a tabela `Documento` no MVP, sem adicionar campo novo em `Titular`.

Motivo: o backend já usa `Documento` para armazenar `FOTO_PERFIL`, reduzindo migração e evitando alterar o modelo principal do titular. A principal correção necessária é criar um contrato de leitura seguro para o `/cliente` mobile.

Não é recomendado adicionar `documentos` diretamente em `TITULAR_FULL_INCLUDE` sem cuidado, porque `TitularService.getById` também é usado pela busca pública por CPF. Expor todos os documentos nesse include poderia vazar a foto ou outros documentos em uma rota pública.

## Contrato de dados proposto

Opção preferida: incluir somente a foto de perfil no retorno autenticado de `/titular/me`.

```ts
type TitularMeResponse = TitularResponse & {
  fotoPerfil?: {
    id: number;
    arquivoUrl: string;
    dataUpload: string;
  } | null;
};
```

Alternativa: criar endpoint dedicado:

```http
GET /api/:version/titular/me/foto
```

Resposta:

```ts
{
  id: number;
  arquivoUrl: string;
  dataUpload: string;
} | null
```

Para o frontend, a opção de incluir em `/titular/me` é mais simples, pois a home já depende desse carregamento inicial.

## Fases de implementação

### Fase 1: backend de leitura segura

1. Criar método no `TitularService`, por exemplo `buscarFotoPerfil(titularId: number)`.
2. Usar esse método no controller de `/titular/me`, sem alterar a resposta da busca pública.
3. Retornar `fotoPerfil` com apenas `id`, `arquivoUrl` e `dataUpload`.
4. Ajustar a resposta de `POST /titular/me/foto` para manter o mesmo formato.
5. Opcional: adicionar `GET /titular/me/foto` se for preferível separar o payload.

### Fase 2: frontend de exibição

1. Adicionar `fotoPerfilUrl?: string | null` em `ClientePlano`.
2. Atualizar o tipo interno `TitularResponse` em `clienteCarteirinha.service.ts`.
3. Mapear `titular.fotoPerfil?.arquivoUrl` para `ClientePlano.fotoPerfilUrl`.
4. Atualizar `HomeScreen` para:
   - renderizar `<img>` quando houver `fotoPerfilUrl`;
   - manter fallback pela inicial do nome;
   - evitar `next/image` para URL externa não configurada, ou então configurar `remotePatterns` no `next.config.ts`.

### Fase 3: upload no mobile

1. Trocar os botões do modal por inputs reais:
   - galeria: `accept="image/png,image/jpeg,image/webp"`;
   - câmera: `accept="image/*"` com `capture="user"`.
2. Converter o arquivo para base64.
3. Validar no frontend:
   - tipo permitido;
   - tamanho máximo de 5 MB;
   - mensagem clara quando o arquivo for inválido.
4. Opcional, mas recomendado: redimensionar/comprimir no navegador para no máximo 1024 px no maior lado antes do envio.
5. Chamar `salvarFotoPerfilCliente`.
6. Atualizar o estado `cliente.fotoPerfilUrl` após sucesso, sem exigir reload.
7. Fechar modal ou exibir confirmação de sucesso.

### Fase 4: remoção e troca

1. Adicionar ação secundária `Remover foto` quando o cliente já tiver foto.
2. Chamar `removerFotoPerfilCliente`.
3. Limpar `cliente.fotoPerfilUrl` localmente após `204`.
4. Ao enviar uma nova foto, substituir a anterior no banco mantendo apenas um documento `FOTO_PERFIL`.

### Fase 5: testes

Backend:

- upload sem `cliente_token` retorna `401`;
- upload sem `imageBase64` retorna `400`;
- upload com MIME inválido retorna `400`;
- upload acima de 5 MB retorna `400`;
- cliente A não altera foto do cliente B;
- novo upload substitui o documento `FOTO_PERFIL` anterior;
- delete remove a foto do titular autenticado.

Frontend:

- home renderiza imagem quando `fotoPerfilUrl` existe;
- home usa inicial quando não existe foto;
- modal envia arquivo válido;
- erro de tamanho/tipo aparece na tela;
- sucesso atualiza avatar sem reload;
- remover foto volta ao fallback de inicial.

## Critérios de aceite

- Cliente autenticado consegue selecionar foto da galeria no mobile.
- Cliente autenticado consegue tirar foto pelo fluxo nativo do navegador mobile quando suportado.
- Foto salva aparece na home do `/cliente` mobile após upload.
- Foto salva continua aparecendo após logout/login.
- Remoção da foto volta para avatar com inicial.
- Desktop do `/cliente` não muda.
- Busca pública por CPF não passa a expor documentos nem foto de perfil.
- Rotas usam `cliente_token` e nunca recebem `titularId` do cliente no payload.

## Riscos e cuidados

- **Privacidade:** não expor `documentos` em rotas públicas.
- **Arquivos órfãos:** o modelo `Documento` não guarda `arquivoId`; se a Files API tiver delete, será melhor persistir esse ID futuramente.
- **Tamanho do payload:** o backend aceita JSON até 10 MB e a foto até 5 MB. Redimensionar no frontend reduz falhas em rede móvel.
- **Cache da imagem:** se a Files API retornar URL estável para substituições, pode ser necessário adicionar query string com `dataUpload` para forçar atualização visual.
- **Domínio da imagem:** se usar `next/image`, incluir o domínio da Files API em `next.config.ts`; caso contrário usar `<img>` no avatar.
- **Compatibilidade de câmera:** `capture="user"` depende do navegador. Deve haver fallback para galeria.

## Ordem sugerida

1. Backend: expor `fotoPerfil` de forma segura em `/titular/me`.
2. Frontend: mapear e renderizar `fotoPerfilUrl` na home.
3. Frontend: ligar upload por galeria.
4. Frontend: ligar captura por câmera como variação do mesmo input.
5. Frontend: adicionar remoção.
6. Testes backend.
7. Validação manual em viewport mobile.

## Escopo fora do MVP

- Recorte/crop avançado.
- Edição por zoom/rotação.
- Sincronização da foto com painel administrativo.
- Limpeza física do arquivo antigo na Files API, salvo se a API já oferecer endpoint simples e seguro.
- Campo `fotoPerfilUrl` direto no modelo `Titular`.
