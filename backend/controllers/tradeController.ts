import { Request, Response } from 'express';
import TradeModel from '../models/trade';
import TradeProcessor from '../processing/tradeProcessor';
import { Trade } from '../types/trade';

const tradeController = {
    getAllTrades: (req: Request, res: Response) => {
        TradeModel.findAll((err, trades) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(trades);
        });
    },

    addTrade: (req: Request, res: Response) => {
        const newTrade: Trade = req.body;
        TradeModel.create(newTrade, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(201).json(result);
        });
    },

    updateTrade: (req: Request, res: Response) => {
        const tradeId = parseInt(req.params.id, 10);
        const updatedTrade: Trade = req.body;
        TradeModel.update(tradeId, updatedTrade, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.changes === 0) {
                return res.status(404).send('Trade not found');
            }
            res.status(200).json({ message: 'Trade updated successfully' });
        });
    },

    getTradesByPositionId: (req: Request, res: Response) => {
        const positionId = parseInt(req.params.positionId, 10);
        TradeModel.findByPositionId(positionId, (err, trades) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(trades);
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
    },

    createPartialExit: (req: Request, res: Response) => {
        const tradeId = parseInt(req.params.id, 10);
        const { exit_quantity, exit_price, exit_date } = req.body;

        if (!exit_quantity || !exit_price || !exit_date || exit_quantity <= 0) {
            return res.status(400).json({ message: 'Exit quantity, price, and date are required, and quantity must be positive.' });
        }

        TradeModel.find(tradeId, (err, originalTrade) => {
            if (err || !originalTrade) {
                return res.status(500).json({ error: err ? err.message : 'Original trade not found' });
            }
            if (exit_quantity > originalTrade.quantity) {
                return res.status(400).json({ message: 'Exit quantity cannot be greater than the trade quantity.' });
            }

            const partialTradeForCalc: Trade = {
                ...originalTrade,
                quantity: exit_quantity,
                exit_price: exit_price,
                exit_date: exit_date,
            };
            const processedPartialTrade = TradeProcessor.calculateResult(partialTradeForCalc);

            const partialTradeToCreate: Trade = {
                ...processedPartialTrade,
                position_id: originalTrade.position_id,
                observations: `Partial exit from trade #${tradeId}. ${originalTrade.observations || ''}`.trim()
            };

            TradeModel.create(partialTradeToCreate, (err, createResult) => {
                if (err) {
                    return res.status(500).json({ error: `Error creating partial trade: ${err.message}` });
                }

                const new_quantity = originalTrade.quantity - exit_quantity;

                if (new_quantity > 0) {
                    const updatedOriginalTrade: Trade = { ...originalTrade, quantity: new_quantity };
                    TradeModel.update(tradeId, updatedOriginalTrade, (err, updateResult) => {
                        if (err) {
                            return res.status(500).json({ error: `Error updating original trade: ${err.message}` });
                        }
                        res.status(200).json({ message: 'Partial exit executed successfully.' });
                    });
                } else {
                    TradeModel.delete(tradeId, (err, deleteResult) => {
                        if (err) {
                            return res.status(500).json({ error: `Error deleting original trade: ${err.message}` });
                        }
                        res.status(200).json({ message: 'Trade completely closed with partial exit.' });
                    });
                }
            });
        });
    }
};

export default tradeController; 