import { Trade } from '../types/trade';

const TradeProcessor = {
    calculateResult: (trade: Trade): Trade => {
        let result = trade.result || 0;

        if (trade.entry_price && trade.exit_price && trade.quantity) {
            const entry = Number(trade.entry_price);
            const exit = Number(trade.exit_price);
            const quantity = Number(trade.quantity);

            if (trade.type === 'Buy') {
                result = (exit - entry) * quantity;
            } else { // Sell
                result = (entry - exit) * quantity;
            }
        }

        return {
            ...trade,
            result
        };
    }
};

export default TradeProcessor; 