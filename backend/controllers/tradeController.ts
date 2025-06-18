import { Request, Response } from 'express';
import TradeModel from '../models/trade';
import TradeProcessor from '../processing/tradeProcessor';
import { Trade } from '../types/trade';

const tradeController = {
    getAllTrades: (req: Request, res: Response) => {
        TradeModel.findAll((err: Error | null, trades: Trade[]) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(trades);
        });
    },

    addTrade: (req: Request, res: Response) => {
        const tradeData: Trade = req.body;
        const processedTrade = TradeProcessor.calculateResult(tradeData);
        TradeModel.create(processedTrade, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(201).json({ ...processedTrade, id: result.id });
        });
    },

    updateTrade: (req: Request, res: Response) => {
        const tradeId = parseInt(req.params.id, 10);
        const tradeData: Trade = req.body;
        const processedTrade = TradeProcessor.calculateResult(tradeData);

        TradeModel.update(tradeId, processedTrade, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.changes === 0) {
                return res.status(404).send('Trade not found');
            }
            res.json({ ...processedTrade, id: tradeId });
        });
    },

    deleteTrade: (req: Request, res: Response) => {
        const tradeId = parseInt(req.params.id, 10);
        TradeModel.delete(tradeId, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.changes === 0) {
                return res.status(404).send('Trade not found');
            }
            res.status(204).send();
        });
    }
};

export default tradeController; 