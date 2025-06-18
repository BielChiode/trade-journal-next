export interface Trade {
    id?: number;
    ticker: string;
    tipo: 'Compra' | 'Venda';
    data_entrada: string;
    preco_entrada: number;
    data_saida?: string | null;
    preco_saida?: number | null;
    quantidade: number;
    setup?: string | null;
    observacoes?: string | null;
    resultado?: number | null;
} 