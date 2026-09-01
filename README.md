# ibid-workspace

Monorepo Nx que agrupa os produtos Angular da ibid à volta de um design system e de um
conjunto de bibliotecas partilhadas.

A ideia é simples: cada produto é uma aplicação independente em `apps/`, e tudo o que for
genérico o suficiente para ser reutilizado por mais do que um produto — componentes visuais,
funções utilitárias, serviços de infraestrutura — vive em `libs/` e é consumido por importação.

## Estrutura

```
apps/
  boilerplate/       esqueleto Angular mínimo, ponto de partida para produtos novos

libs/
  ibid-ui/           design system: componentes e estilos globais
  services/          serviços de infraestrutura (i18n, autenticação, sincronização)
  utils/             funções puras, sem dependências
```

### Regra de dependência

- Uma **app** pode importar de qualquer **lib**.
- Uma **lib** nunca importa de uma **app**.
- Entre libs, a única dependência permitida é para `utils` — a única sem dependências próprias.

A regra é validada em lint pelo `@nx/enforce-module-boundaries`, configurado em
`eslint.config.mjs`.

## Aplicações

### `apps/boilerplate`

Aplicação Angular vazia que serve de molde para produtos novos: routing configurado,
`styles.scss` já a importar o design system e nada mais. Copia-se esta pasta para arrancar
uma app nova em vez de gerar tudo de raiz.

```
apps/boilerplate/
  src/
    app/            componente raiz, rotas e configuração de bootstrap
    styles.scss     importa os estilos globais de libs/ibid-ui
    index.html
    main.ts
  public/           assets estáticos copiados para o build
  project.json      targets: build, serve, test, lint, serve-static
```

## Bibliotecas

### `libs/ibid-ui` — importada como `ibid-ui`

O design system. Os componentes seguem Atomic Design, organizados por nível de composição:

```
src/lib/
  atoms/        button, icon (+ icon-registry), icon-button, divider, select,
                date-input, number-input, search-input, empty-state, drag-handle,
                stack-dots, stat-icon, view-more-link, legend-item, currency-display,
                chart-tooltip, chart-marker-dot, chart-bar-segment,
                bottom-sheet-header / -body / -footer
  molecules/    card, form-field, metric-card, stat-card, summary-row, progress-row,
                segmented-control, info-balloon, bottom-sheet-dialog,
                chart-headline, chart-legend
  organisms/    bar-chart, line-chart, chart
  directives/   hand-drawn
  models/       tipos partilhados de UI e de séries de gráficos
```

Os estilos globais estão em `src/styles/`, organizados em ITCSS por especificidade crescente:

```
src/styles/
  settings/     colors, typography, spacing, elevation, breakpoints (sem output CSS)
  tools/        mixins (sem output CSS)
  generic/      reset, scrollbars
  elements/     base, icons
  objects/      layout, table, hand-drawn, bottom-sheet-dialog
  components/   buttons, forms, cards, selects, menus, metrics-summary-card
  trumps/       utilities
```

O ponto de entrada é `src/styles.scss`, que faz o `@use` de todas as camadas pela ordem
correta. Uma app consome tudo com uma linha no seu `styles.scss`:

```scss
@use 'libs/ibid-ui/src/styles';
```

### `libs/services` — importada como `@ibid/services`

Serviços de infraestrutura, sem lógica de negócio de nenhum produto:

- **i18n** — `I18nService` e os pipes `appTranslate`, `appDate`, `appCurrency`. Os dicionários
  de tradução pertencem a cada app, não à lib.
- **sync** — `GoogleAuthService` (autenticação via Capacitor) e `ConflictResolverService`
  (resolução de conflitos em sincronização).

### `libs/utils` — importada como `@ibid/utils`

Funções puras, sem estado e sem dependências: `date.utils`, `string.utils`, `parsing.utils`,
`color-contrast.utils`. Cada ficheiro tem o `.spec.ts` correspondente.

### Aliases

Definidos em `tsconfig.base.json`:

| Alias            | Caminho                      |
| ---------------- | ---------------------------- |
| `ibid-ui`        | `libs/ibid-ui/src/index.ts`  |
| `@ibid/services` | `libs/services/src/index.ts` |
| `@ibid/utils`    | `libs/utils/src/index.ts`    |

Importa-se sempre pelo alias — nunca por caminho relativo entre projetos.

## Stack

- **Angular 22** com componentes standalone e o builder `@angular/build`
- **Nx 23** para o grafo de projetos, cache e execução de tarefas
- **TypeScript 6** em modo estrito (`strict`, `noUnusedLocals`, `noImplicitReturns`)
- **Vitest** + jsdom para testes unitários
- **ESLint** flat config, com validação das fronteiras entre projetos
- **ng-packagr** para o empacotamento das libs
- **Capacitor** para as builds móveis

## Comandos

Instalar dependências:

```bash
npm install
```

Servir a aplicação em desenvolvimento:

```bash
npx nx serve boilerplate
```

Build de produção de um projeto:

```bash
npx nx build boilerplate
```

Testes e lint de um projeto:

```bash
npx nx test ibid-ui
```

```bash
npx nx lint ibid-ui
```

Correr uma tarefa em todos os projetos afetados pelas alterações locais:

```bash
npx nx affected -t lint test build
```

Ver os targets disponíveis num projeto:

```bash
npx nx show project ibid-ui --web
```

Ver o grafo de dependências entre projetos:

```bash
npx nx graph
```

## Convenções de código

- **SCSS** — ITCSS para as camadas e BEM para os nomes de classe (`.block`, `.block__element`,
  `.block--modifier`). Nenhum override fora da camada `trumps`.
- **TypeScript** — sem `any`; `unknown` ou generics no lugar. `readonly` para imutabilidade,
  optional chaining e nullish coalescing para null-safety, type guards em vez de assertions.
- **Estrutura** — funções pequenas com uma só responsabilidade e um só nível de abstração,
  ficheiros até 200–300 linhas, nomes que revelam intenção.
- **Formatação** — Prettier e ESLint são a autoridade; nada de formatação manual contra a
  configuração do repositório.

## Integração contínua

O workflow em `.github/workflows/ci.yml` corre em cada push para `main` e em cada pull request.
Verifica a formatação com `nx format:check` e depois executa, em todos os projetos:

```bash
npx nx run-many -t lint test build typecheck e2e
```

O workflow assume distribuição de tarefas por Nx Cloud (`nx start-ci-run`), que ainda não está
ligado a este repositório.
