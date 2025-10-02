// A mesma interface do backend, para garantir consistência
export interface Trade {
    id?: number;
    position_id?: number;
    ticker: string;
    type: 'Buy' | 'Sell';
    entry_date: Date;
    entry_price: number;
    exit_date?: Date | null;
    exit_price?: number | null;
    quantity: number;
    setup?: string | null;
    observations?: string | null;
    result?: number | null;
} 

export interface Position {
  id: number;
  user_id: number;
  ticker: string;
  type: 'Buy' | 'Sell';
  status: 'Open' | 'Closed';
  average_entry_price: number;
  current_quantity: number;
  total_realized_pnl: number;
  initial_entry_date: Date;
  last_exit_date?: Date | null;
  total_quantity?: number;
  average_exit_price?: number;
  setup?: string;
  observations?: string;
  stop_gain?: number;
  stop_loss?: number;
  operations: Operation[];
  current_price?: number;
}

export interface Operation {
  id: number;
  position_id: number;
  user_id: number;
  operation_type: 'Entry' | 'Increment' | 'PartialExit';
  quantity: number;
  price: number;
  date: Date;
  result?: number;
  observations?: string;
} 