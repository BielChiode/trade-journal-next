import { Trade } from '../types/trade';

const TradeProcessor = {
    calculateResult: (trade: Trade): Trade => {
        let resultado = trade.resultado || 0;

        if (trade.preco_entrada && trade.preco_saida && trade.quantidade) {
            const entrada = Number(trade.preco_entrada);
            const saida = Number(trade.preco_saida);
            const quantidade = Number(trade.quantidade);

            if (trade.tipo === 'Compra') {
                resultado = (saida - entrada) * quantidade;
            } else { // Venda
                resultado = (entrada - saida) * quantidade;
            }
        }

        return {
            ...trade,
            resultado
        };
    }
};

export default TradeProcessor; 