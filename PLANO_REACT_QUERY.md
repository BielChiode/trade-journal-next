# Plano de Implementação - React Query (TanStack Query)

## 📋 Visão Geral

Este documento descreve o plano completo para implementar **React Query (TanStack Query)** no projeto Trade Journal Next.js, substituindo o gerenciamento manual de estado de dados do servidor por uma solução robusta e baseada em melhores práticas.

## 🎯 Objetivos

1. **Centralizar o gerenciamento de estado do servidor** usando React Query
2. **Melhorar a experiência do usuário** com cache automático, refetching inteligente e estados de loading/error
3. **Reduzir código boilerplate** relacionado a loading states, error handling e refetching manual
4. **Integrar com o sistema de autenticação existente** (interceptors do axios)
5. **Otimizar performance** com cache, deduplicação de requisições e background updates

---

## 📦 Fase 1: Setup Inicial e Dependências

### 1.1 Instalação de Dependências

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Dependências:**
- `@tanstack/react-query`: Biblioteca principal
- `@tanstack/react-query-devtools`: Ferramentas de desenvolvimento (opcional mas recomendado)

### 1.2 Estrutura de Arquivos Proposta

```
src/
├── lib/
│   └── react-query/
│       ├── queryClient.ts          # Configuração do QueryClient
│       └── queryKeys.ts             # Centralização das query keys
├── hooks/
│   └── queries/
│       ├── usePositions.ts          # Hooks para positions
│       ├── usePosition.ts           # Hook para uma position específica
│       ├── useOperations.ts         # Hooks para operations
│       ├── useTickers.ts            # Hook para busca de tickers
│       └── usePositionPrice.ts      # Hook para preço da position
├── hooks/
│   └── mutations/
│       ├── usePositionMutations.ts  # Mutations para positions
│       └── useOperationMutations.ts # Mutations para operations
└── providers/
    └── QueryProvider.tsx            # Provider do React Query
```

---

## 🔧 Fase 2: Configuração do QueryClient

### 2.1 Criar QueryClient com Configurações Otimizadas

**Arquivo: `src/lib/react-query/queryClient.ts`**

Configurações recomendadas:
- **staleTime**: 5 minutos (dados considerados "frescos" por 5min)
- **cacheTime**: 10 minutos (dados mantidos em cache por 10min após desuso)
- **retry**: 3 tentativas com backoff exponencial
- **refetchOnWindowFocus**: true (refetch quando usuário volta à aba)
- **refetchOnReconnect**: true (refetch quando reconecta à internet)

### 2.2 Integração com Interceptors do Axios

O `apiClient` existente já tem interceptors para autenticação. O React Query funcionará perfeitamente com ele, pois apenas usa as funções de fetch existentes.

### 2.3 Query Keys Factory Pattern

**Arquivo: `src/lib/react-query/queryKeys.ts`**

Criar uma factory de query keys para garantir consistência e facilitar invalidação:

```typescript
export const queryKeys = {
  positions: {
    all: ['positions'] as const,
    lists: () => [...queryKeys.positions.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.positions.lists(), { filters }] as const,
    details: () => [...queryKeys.positions.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.positions.details(), id] as const,
  },
  operations: {
    all: ['operations'] as const,
    byPosition: (positionId: number) => [...queryKeys.operations.all, positionId] as const,
  },
  tickers: {
    all: ['tickers'] as const,
    search: (symbol: string) => [...queryKeys.tickers.all, 'search', symbol] as const,
  },
  positionPrice: {
    all: ['positionPrice'] as const,
    byPosition: (positionId: number) => [...queryKeys.positionPrice.all, positionId] as const,
  },
} as const;
```

---

## 🎣 Fase 3: Criação de Custom Hooks (Queries)

### 3.1 Hook para Lista de Positions

**Arquivo: `src/hooks/queries/usePositions.ts`**

- Usar `useQuery` com a função `getPositions` existente
- Query key: `queryKeys.positions.lists()`
- Habilitar refetch automático quando necessário

### 3.2 Hook para Position Específica

**Arquivo: `src/hooks/queries/usePosition.ts`**

- Query key: `queryKeys.positions.detail(id)`
- Útil para modais de detalhes

### 3.3 Hook para Operations

**Arquivo: `src/hooks/queries/useOperations.ts`**

- Query key: `queryKeys.operations.byPosition(positionId)`
- Dependência da position específica

### 3.4 Hook para Busca de Tickers

**Arquivo: `src/hooks/queries/useTickers.ts`**

- Usar `useQuery` com `enabled: false` inicialmente
- Ativar com `refetch()` quando o usuário digitar
- Implementar debounce (já existe `useDebounce.ts`)
- Query key: `queryKeys.tickers.search(symbol)`

### 3.5 Hook para Preço da Position

**Arquivo: `src/hooks/queries/usePositionPrice.ts`**

- Query key: `queryKeys.positionPrice.byPosition(positionId)`
- Pode ser usado com polling se necessário

---

## ✏️ Fase 4: Criação de Custom Hooks (Mutations)

### 4.1 Mutations para Positions

**Arquivo: `src/hooks/mutations/usePositionMutations.ts`**

Mutations a criar:
- `useCreatePosition`: Criar nova position
- `useUpdatePosition`: Atualizar position
- `useDeletePosition`: Deletar position
- `useIncrementPosition`: Incrementar position
- `usePartialExit`: Saída parcial

**Estratégia de Invalidação:**
- Após criar/atualizar/deletar: invalidar `queryKeys.positions.lists()`
- Após increment/partial exit: invalidar lista e detail específica
- Usar `queryClient.invalidateQueries()` para refetch automático

**Otimizações:**
- Usar `onMutate` para optimistic updates quando apropriado
- Usar `onError` para rollback em caso de falha

### 4.2 Mutations para Operations

**Arquivo: `src/hooks/mutations/useOperationMutations.ts`**

- `useDeleteOperation`: Deletar operation
- Invalidar `queryKeys.operations.byPosition(positionId)` e `queryKeys.positions.detail(positionId)`

### 4.3 Mutations para Preço

- `useSetPositionPrice`: Atualizar preço manualmente
- Invalidar `queryKeys.positionPrice.byPosition(positionId)` e `queryKeys.positions.detail(positionId)`

---

## 🏗️ Fase 5: Integração no App

### 5.1 Criar QueryProvider

**Arquivo: `src/providers/QueryProvider.tsx`**

- Componente client-side que envolve o app
- Inicializa o `QueryClient`
- Inclui `ReactQueryDevtools` em desenvolvimento

### 5.2 Atualizar Root Layout

**Arquivo: `src/app/layout.tsx`**

- Adicionar `QueryProvider` dentro de `AuthProvider`
- Garantir que o provider seja client component

### 5.3 Migração Gradual dos Componentes

**Prioridade de Migração:**

1. **Alta Prioridade:**
   - `src/app/dashboard/page.tsx` - Componente principal
   - Componentes que fazem muitas requisições

2. **Média Prioridade:**
   - `PositionDetailsModal` - Modal de detalhes
   - `PositionForm` - Formulário de criação/edição

3. **Baixa Prioridade:**
   - Componentes menores que fazem poucas requisições

---

## 🔄 Fase 6: Refatoração dos Componentes Existentes

### 6.1 Dashboard Page (`src/app/dashboard/page.tsx`)

**Mudanças:**
- Remover `useState` para `positions` e `isPositionsLoading`
- Substituir `loadPositions()` por `usePositions()`
- Remover `useEffect` de carregamento inicial
- Usar `isLoading`, `isError`, `data` do hook
- Substituir chamadas diretas de mutations por hooks

**Benefícios:**
- Código mais limpo
- Loading states automáticos
- Error handling automático
- Refetch automático quando necessário

### 6.2 PositionDetailsModal

**Mudanças:**
- Usar `usePosition(positionId)` para dados da position
- Usar `useOperations(positionId)` para operations
- Usar mutations hooks para atualizações
- Remover estados manuais de loading

### 6.3 PositionForm

**Mudanças:**
- Usar `useTickers()` com debounce para busca
- Integrar com `useCreatePosition` mutation
- Usar `onSuccess` callback para fechar modal e mostrar feedback

---

## 🎨 Fase 7: Melhorias e Otimizações

### 7.1 Optimistic Updates

Implementar para operações frequentes:
- Criar position
- Atualizar position
- Deletar operation

### 7.2 Background Refetching

Configurar para:
- Refetch positions quando usuário volta à aba
- Refetch price quando modal de detalhes abre
- Polling opcional para preços (se necessário)

### 7.3 Error Handling Global

- Criar componente de error boundary
- Mostrar toasts/notificações para erros de mutations
- Tratar erros 401/403 de forma global

### 7.4 Loading States

- Criar componentes de skeleton loading
- Usar `isLoading` e `isFetching` do React Query
- Mostrar estados de loading diferenciados

---

## 📝 Fase 8: Testes e Validação

### 8.1 Checklist de Validação

- [ ] Todas as queries funcionam corretamente
- [ ] Mutations invalidam caches apropriados
- [ ] Loading states aparecem corretamente
- [ ] Error handling funciona
- [ ] Refetch automático funciona
- [ ] Interceptors de autenticação funcionam
- [ ] DevTools do React Query funcionam
- [ ] Performance melhorou (menos requisições desnecessárias)

### 8.2 Testes Manuais

1. **Criar position** → Verificar se lista atualiza automaticamente
2. **Atualizar position** → Verificar se cache atualiza
3. **Deletar position** → Verificar se remove da lista
4. **Buscar tickers** → Verificar debounce e cache
5. **Navegar entre páginas** → Verificar se cache persiste
6. **Perder conexão** → Verificar retry automático
7. **Token expirado** → Verificar refresh automático

---

## 🚀 Fase 9: Documentação e Manutenção

### 9.1 Documentação

- Documentar padrões de uso dos hooks
- Criar exemplos de uso
- Documentar query keys factory
- Adicionar comentários em código complexo

### 9.2 Convenções do Time

- Sempre usar query keys factory
- Sempre invalidar caches após mutations
- Usar TypeScript para type safety
- Seguir padrão de nomenclatura dos hooks

---

## 📊 Resumo das Mudanças

### Arquivos a Criar:
1. `src/lib/react-query/queryClient.ts`
2. `src/lib/react-query/queryKeys.ts`
3. `src/providers/QueryProvider.tsx`
4. `src/hooks/queries/usePositions.ts`
5. `src/hooks/queries/usePosition.ts`
6. `src/hooks/queries/useOperations.ts`
7. `src/hooks/queries/useTickers.ts`
8. `src/hooks/queries/usePositionPrice.ts`
9. `src/hooks/mutations/usePositionMutations.ts`
10. `src/hooks/mutations/useOperationMutations.ts`

### Arquivos a Modificar:
1. `package.json` - Adicionar dependências
2. `src/app/layout.tsx` - Adicionar QueryProvider
3. `src/app/dashboard/page.tsx` - Migrar para hooks
4. Componentes que usam `tradeService` diretamente

### Arquivos que Permanecem:
- `src/services/apiClient.ts` - Continua sendo usado pelos hooks
- `src/services/tradeService.ts` - Funções são reutilizadas nos hooks
- Estrutura de API routes - Sem mudanças

---

## ⚠️ Considerações Importantes

1. **Compatibilidade com Next.js App Router:**
   - QueryProvider deve ser client component
   - Queries só funcionam em client components
   - Para server components, usar fetch direto ou React Query no client

2. **Autenticação:**
   - Os interceptors do axios continuam funcionando
   - React Query não interfere na lógica de auth
   - Erros 401 são tratados pelos interceptors

3. **Migração Gradual:**
   - É possível migrar componente por componente
   - Não precisa migrar tudo de uma vez
   - Pode coexistir com código antigo temporariamente

4. **Performance:**
   - Cache reduz requisições desnecessárias
   - Deduplicação automática de requisições simultâneas
   - Background refetching mantém dados atualizados

---

## 🎯 Próximos Passos

1. ✅ Revisar e aprovar este plano
2. Instalar dependências
3. Criar estrutura de arquivos
4. Implementar QueryClient e Provider
5. Criar hooks de queries básicas
6. Criar hooks de mutations
7. Migrar componentes gradualmente
8. Testar e validar
9. Documentar padrões

---

**Nota:** Este plano assume o uso de **React Query (TanStack Query)**, não RTK Query. Se você preferir RTK Query (que requer Redux Toolkit), posso criar um plano alternativo.
