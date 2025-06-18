export interface Trade {
    id?: number;
    position_id?: number;
    ticker: string;
    type: 'Buy' | 'Sell';
    entry_date: string;
    entry_price: number;
    exit_date?: string | null;
    exit_price?: number | null;
    quantity: number;
    setup?: string | null;
    observations?: string | null;
    result?: number | null;
} 