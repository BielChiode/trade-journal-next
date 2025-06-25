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

## Tecnologias Utilizadas

- **Framework**: Next.js (App Router)
- **Linguagem**: TypeScript
- **Frontend**: React
- **UI**: Tailwind CSS, shadcn/ui, Lucide React (ícones)
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Ambiente de Desenvolvimento**: Docker
- **Comunicação com API**: Axios

## Rodando Localmente

Para executar o projeto em seu ambiente de desenvolvimento, é necessário ter o **Docker** e o **Node.js/Yarn** instalados.

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd trade-journal-next
    ```

2.  **Instale as dependências:**
    ```bash
    yarn
    ```
    
3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env.local` na raiz do projeto. Ele será usado para a conexão com o banco de dados do Docker.
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/trade_journal?sslmode=disable"
    JWT_SECRET="segredo-super-secreto-para-desenvolvimento-local"
    ```

4.  **Inicie o Banco de Dados com Docker:**
    Este comando irá iniciar um container com o PostgreSQL em segundo plano.
    ```bash
    docker-compose up -d
    ```

5.  **Aplique as Migrações do Banco de Dados:**
    Este comando executará as migrações do Prisma para criar as tabelas na sua base de dados local.
    ```bash
    yarn prisma:migrate
    ```

6.  **Inicie o Servidor de Desenvolvimento:**
    ```bash
    yarn dev
    ```
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

### Comandos Úteis do Prisma (Local)

- **`yarn prisma:studio`**: Abre uma interface gráfica no navegador para visualizar e editar os dados do seu banco de dados local.
- **`yarn prisma:reset`**: Limpa completamente seu banco de dados local e aplica as migrações novamente. Útil para começar do zero.

## Deploy na Vercel

A aplicação está pronta para deploy na Vercel.

1.  **Conecte seu repositório** a um novo projeto na Vercel.
2.  **Crie um Banco de Dados Vercel Postgres** na aba "Storage" e conecte-o ao seu projeto. Isso irá configurar automaticamente a variável de ambiente `DATABASE_URL` em produção.
3.  **Adicione a variável `JWT_SECRET`** nas configurações de ambiente do projeto na Vercel com um valor seguro.
4.  Faça o deploy. O script `postinstall` irá executar `prisma generate` automaticamente, garantindo que o cliente do Prisma esteja otimizado para o ambiente da Vercel.

## Estrutura do Projeto

O projeto utiliza a estrutura do App Router do Next.js:

```
trade-journal-next/
├── prisma/               # Schema e migrações do Prisma
├── src/
│   ├── app/
│   │   ├── api/          # Rotas da API (backend)
│   │   ├── dashboard/    # Página principal da aplicação
│   │   └── ...
│   ├── components/       # Componentes React reutilizáveis
│   ├── contexts/         # Contextos React (ex: Autenticação)
│   ├── lib/              # Funções utilitárias, cliente Prisma
│   └── ...
├── docker-compose.yml    # Configuração do Docker para o ambiente local
├── package.json          # Dependências e scripts
└── README.md             # Este arquivo
```

## API Endpoints

- `GET /api/trades`: Retorna todas as posições do usuário autenticado.
- `POST /api/trades`: Adiciona uma nova posição com sua operação de entrada.
- `PUT /api/trades/[id]`: Atualiza o setup e observações de uma posição.
- `DELETE /api/trades/[id]`: Deleta uma posição e suas operações.
- `POST /api/positions/[id]/partial-exit`: Registra uma saída parcial de uma posição.
- `POST /api/positions/[id]/increment`: Registra um incremento em uma posição.
- `POST /api/auth/login`: Autentica um usuário.
- `POST /api/auth/register`: Registra um novo usuário.
- `POST /api/auth/refresh`: Gera um novo token de acesso a partir de um refresh token. 