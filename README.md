# Trade Journal

Sistema de registro de trades com backend em Node.js + Express + SQLite e frontend em React.

## Visão Geral

Este projeto é um sistema de diário de trades para registrar e analisar operações no mercado financeiro. A arquitetura segue o padrão MCP (Modelo-Controle-Processamento) para o backend, visando uma estrutura organizada e preparada para futuras integrações, como análises com Inteligência Artificial.

## Funcionalidades

- **Registro de Trades**: Adicione novas operações com informações detalhadas.
- **Listagem de Trades**: Visualize todas as operações registradas em uma tabela.
- **Cálculo de Resultado**: O sistema calcula automaticamente o lucro ou prejuízo de cada operação.
- **Gráfico de Lucro Acumulado**: Acompanhe a evolução do seu resultado com um gráfico interativo.

## Estrutura do Projeto

```
trade-journal/
├── backend/
│   ├── controllers/      # Controladores (rotas da API)
│   ├── models/           # Modelos de dados (interação com o BD)
│   ├── processing/       # Lógica de negócio e processamento
│   ├── db/               # Configuração do banco de dados
│   └── app.js            # Ponto de entrada do backend
├── frontend/
│   ├── public/           # Arquivos estáticos
│   └── src/
│       ├── components/   # Componentes React
│       ├── pages/        # Páginas da aplicação
│       ├── services/     # Serviços (chamadas de API)
│       └── App.jsx       # Componente principal do frontend
├── trades.db             # Arquivo do banco de dados SQLite
├── package.json          # Dependências e scripts do projeto
└── README.md             # Este arquivo
```

## Tecnologias Utilizadas

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, Chart.js, Axios
- **Utilitários**: Concurrently, Nodemon

## Como Executar

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd trade-journal
    ```

2.  **Instale as dependências do backend e do frontend:**
    ```bash
    npm install
    ```

3.  **Inicie a aplicação em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Isso iniciará o backend em `http://localhost:3001` e o frontend em `http://localhost:3000`.

4.  **Para build de produção (frontend):**
    ```bash
    cd frontend
    npm run build
    ```
## API Endpoints

- `GET /api/trades`: Retorna todos os trades.
- `POST /api/trades`: Adiciona um novo trade.
- `DELETE /api/trades/:id`: Deleta um trade. 