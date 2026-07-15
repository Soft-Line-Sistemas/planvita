# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tmp-planos-prod.spec.ts >> producao mobile: titular dentro da faixa chega ao passo de planos
- Location: tmp-planos-prod.spec.ts:13:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select').nth(2)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - button "Voltar" [ref=e9] [cursor=pointer]:
          - img [ref=e10]
        - heading "Cadastro" [level=1] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - paragraph [ref=e15]: Endereço do titular
          - generic [ref=e17]:
            - 'button "Etapa 1: Titular" [ref=e18] [cursor=pointer]'
            - 'button "Etapa 2: Endereço do titular" [ref=e19] [cursor=pointer]'
            - 'button "Etapa 3: Corresponsável financeiro" [ref=e20] [cursor=pointer]'
            - 'button "Etapa 4: Endereço do corresponsável" [ref=e21] [cursor=pointer]'
            - 'button "Etapa 5: Dependentes" [ref=e22] [cursor=pointer]'
            - 'button "Etapa 6: Planos" [ref=e23] [cursor=pointer]'
            - 'button "Etapa 7: Serviços adicionais" [ref=e24] [cursor=pointer]'
            - 'button "Etapa 8: Forma de pagamento" [ref=e25] [cursor=pointer]'
            - 'button "Etapa 9: Confirmação de cadastro" [ref=e26] [cursor=pointer]'
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - generic [ref=e31]: CEP*
              - textbox "00000-000" [active] [ref=e32]: 40000-000
            - generic [ref=e33]:
              - generic [ref=e34]: UF*
              - combobox [ref=e35] [cursor=pointer]:
                - option "UF" [selected]
                - option "AC"
                - option "AL"
                - option "AP"
                - option "AM"
                - option "BA"
                - option "CE"
                - option "DF"
                - option "ES"
                - option "GO"
                - option "MA"
                - option "MT"
                - option "MS"
                - option "MG"
                - option "PA"
                - option "PB"
                - option "PR"
                - option "PE"
                - option "PI"
                - option "RJ"
                - option "RN"
                - option "RS"
                - option "RO"
                - option "RR"
                - option "SC"
                - option "SP"
                - option "SE"
                - option "TO"
          - generic [ref=e36]:
            - generic [ref=e37]: Cidade*
            - textbox "Cidade" [ref=e38]
          - generic [ref=e39]:
            - generic [ref=e40]: Bairro*
            - textbox "Bairro" [ref=e41]
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: Rua / Logradouro*
              - textbox "Nome da rua" [ref=e45]
            - generic [ref=e46]:
              - generic [ref=e47]: Número*
              - textbox "Nº" [ref=e48]
          - generic [ref=e49]:
            - generic [ref=e50]: Complemento
            - textbox "Apto, bloco… (opcional)" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]: Ponto de referência*
            - textbox "Próximo a…" [ref=e54]
        - generic [ref=e56]:
          - button "Voltar" [ref=e57] [cursor=pointer]:
            - img [ref=e58]
            - text: Voltar
          - button "Continuar" [ref=e60] [cursor=pointer]:
            - text: Continuar
            - img [ref=e61]
  - region "Notifications alt+T"
  - alert [ref=e63]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.use({
  4  |   viewport: { width: 390, height: 844 },
  5  |   launchOptions: {
  6  |     executablePath: "/snap/bin/chromium",
  7  |     args: ["--no-sandbox", "--disable-dev-shm-usage"],
  8  |   },
  9  |   userAgent:
  10 |     "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  11 | });
  12 | 
  13 | test("producao mobile: titular dentro da faixa chega ao passo de planos", async ({
  14 |   page,
  15 | }) => {
  16 |   const planResponses: Array<{ url: string; body: unknown }> = [];
  17 | 
  18 |   page.on("response", async (response) => {
  19 |     if (!response.url().includes("/api/v1/plano/sugerir")) return;
  20 |     try {
  21 |       planResponses.push({
  22 |         url: response.url(),
  23 |         body: await response.json(),
  24 |       });
  25 |     } catch {
  26 |       planResponses.push({
  27 |         url: response.url(),
  28 |         body: await response.text(),
  29 |       });
  30 |     }
  31 |   });
  32 | 
  33 |   await page.goto("https://app.campodobosque.com.br/cliente/cadastro", {
  34 |     waitUntil: "networkidle",
  35 |   });
  36 | 
  37 |   await page.getByPlaceholder("Nome completo").fill("Cliente Teste");
  38 |   await page.getByPlaceholder("000.000.000-00").first().fill("12345678901");
  39 |   await page.locator('input[type="date"]').first().fill("1961-07-15");
  40 |   await page.locator("select").nth(0).selectOption("Masculino");
  41 |   await page.getByPlaceholder("Cidade onde nasceu").fill("Salvador");
  42 |   await page.locator("select").nth(1).selectOption("Solteiro(a)");
  43 |   await page.getByPlaceholder("Sua profissão").fill("Aposentado");
  44 |   await page.getByPlaceholder("(00) 00000-0000").nth(0).fill("71999999999");
  45 |   await page.getByPlaceholder("(00) 00000-0000").nth(1).fill("71999999999");
  46 |   await page.getByPlaceholder("seu@email.com").fill("cliente.teste@example.com");
  47 |   await page.getByRole("button", { name: /continuar/i }).click();
  48 | 
  49 |   await page.locator('input[placeholder="00000-000"]').fill("40000000");
> 50 |   await page.locator("select").nth(2).selectOption("BA");
     |                                       ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  51 |   await page.locator('input[placeholder="Cidade"]').first().fill("Salvador");
  52 |   await page.locator('input[placeholder="Bairro"]').fill("Centro");
  53 |   await page.locator('input[placeholder="Nome da rua"]').fill("Rua A");
  54 |   await page.locator('input[placeholder="Nº"]').fill("10");
  55 |   await page.locator('input[placeholder="Próximo a…"]').fill("Praca");
  56 |   await page.getByRole("button", { name: /continuar/i }).click();
  57 | 
  58 |   await page.getByPlaceholder("Nome do responsável").fill("Responsavel Teste");
  59 |   await page.getByPlaceholder("000.000.000-00").nth(1).fill("98765432100");
  60 |   await page.locator('input[type="date"]').nth(1).fill("1960-01-01");
  61 |   await page.locator("select").nth(3).selectOption("Cônjuge");
  62 |   await page.locator("select").nth(4).selectOption("Feminino");
  63 |   await page.locator('input[placeholder="Cidade"]').nth(1).fill("Salvador");
  64 |   await page.locator("select").nth(5).selectOption("Casado(a)");
  65 |   await page.getByPlaceholder("Sua profissão").nth(1).fill("Professora");
  66 |   await page.getByPlaceholder("seu@email.com").nth(1).fill("responsavel.teste@example.com");
  67 |   await page.getByPlaceholder("(00) 00000-0000").nth(2).fill("71999999999");
  68 |   await page.getByPlaceholder("(00) 00000-0000").nth(3).fill("71999999999");
  69 |   await page.getByRole("button", { name: /continuar/i }).click();
  70 | 
  71 |   await page.getByRole("checkbox").check();
  72 |   await expect(
  73 |     page.getByText(/Bosque (Plus|Família|Sênior|Premium|Essencial)/),
  74 |   ).toBeVisible();
  75 | 
  76 |   expect(planResponses.length).toBeGreaterThan(0);
  77 | });
  78 | 
```