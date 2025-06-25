# Trade Journal Next

Um diário de trades moderno e completo, construído com o framework Next.js, para registrar e analisar suas operações no mercado financeiro.

## Visão Geral

Este projeto é uma re-implementação e modernização de um diário de trades, utilizando uma arquitetura full-stack com Next.js (App Router). O objetivo é fornecer uma ferramenta robusta, rápida e com uma interface de usuário intuitiva para que traders possam gerenciar suas operações de forma eficiente. O backend é servido através das API Routes do Next.js e o frontend é construído com React e componentes `shadcn/ui`.

## Funcionalidades

- **Autenticação de Usuários**: Sistema de registro e login para proteger seus dados.
- **Registro Completo de Trades**: Adicione novas posições (compra ou venda) com informações detalhadas como ticker, preço de entrada, quantidade e setup.
- **Gerenciamento de Posições**:
    - **Incremento de Posição**: Adicione mais contratos/ações a uma posição aberta.
    - **Saída Parcial**: Realize lucros ou reduza o risco vendendo parte de uma posição.
- **Dashboard Analítico**:
    - Métricas chave como lucro total, capital atual e histórico de performance.
    - Gráfico de lucro acumulado para visualização do progresso.
- **Histórico Detalhado**: Visualize todas as posições abertas e fechadas com filtros por status, ticker e resultado (lucro/prejuízo).
- **Interface Moderna**: UI limpa e responsiva construída com Tailwind CSS e shadcn/ui.

## Estrutura do Projeto

O projeto utiliza a estrutura do App Router do Next.js:

```
trade-journal-next/
├── src/
│   ├── app/
│   │   ├── api/          # Rotas da API (backend)
│   │   ├── dashboard/    # Página principal da aplicação
│   │   ├── login/        # Página de login
│   │   └── ...           # Outras páginas e layouts
│   ├── components/       # Componentes React reutilizáveis (TradeForm, etc.)
│   │   └── ui/           # Componentes de UI (shadcn/ui)
│   ├── contexts/         # Contextos React (ex: AuthContext)
│   ├── lib/              # Funções utilitárias, helpers de BD
│   ├── models/           # Modelo de dados (interação com o BD)
│   ├── services/         # Funções para chamadas de API (client-side)
│   └── types/            # Definições de tipos TypeScript
├── public/               # Arquivos estáticos
├── trades.db             # Arquivo do banco de dados SQLite
├── next.config.ts        # Configuração do Next.js
├── package.json          # Dependências e scripts
└── README.md             # Este arquivo
```

## Tecnologias Utilizadas

- **Framework**: Next.js (App Router)
- **Linguagem**: TypeScript
- **Frontend**: React
- **UI**: Tailwind CSS, shadcn/ui, Lucide React (ícones)
- **Banco de Dados**: SQLite
- **Comunicação com API**: Axios

## Como Executar

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd trade-journal-next
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

4.  **Para build de produção:**
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

- `GET /api/trades`: Retorna todos os trades do usuário autenticado.
- `POST /api/trades`: Adiciona uma nova posição.
- `PUT /api/trades/[id]`: Atualiza uma posição (trade principal).
- `DELETE /api/trades/[id]`: Deleta uma posição completa.
- `POST /api/positions/[id]/partial-exit`: Registra uma saída parcial de uma posição.
- `POST /api/positions/[id]/increment`: Registra um incremento em uma posição.
- `POST /api/auth/login`: Autentica um usuário.
- `POST /api/auth/register`: Registra um novo usuário. 