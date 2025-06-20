import { Request, Response } from 'express';
import TradeModel from '../models/trade';
import TradeProcessor from '../processing/tradeProcessor';
import { Trade } from '../types/trade';

const tradeController = {
    getAllTrades: (req: Request, res: Response) => {
        const userId = req.user.id;
        TradeModel.findAllByUser(userId, (err, trades) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(trades);
        });
    },

    addTrade: (req: Request, res: Response) => {
        const userId = req.user.id;
        const newTrade: Trade = req.body;
        TradeModel.create(newTrade, userId, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.status(201).json(result);
        });
    },

    updateTrade: (req: Request, res: Response) => {
        const userId = req.user.id;
        const tradeId = parseInt(req.params.id, 10);
        const updatedTrade: Trade = req.body;
        TradeModel.update(tradeId, userId, updatedTrade, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.changes === 0) {
                return res.status(404).send('Trade not found or user not authorized');
            }
            res.status(200).json({ message: 'Trade updated successfully' });
        });
    },

    getTradesByPositionId: (req: Request, res: Response) => {
        const userId = req.user.id;
        const positionId = parseInt(req.params.positionId, 10);
        TradeModel.findByPositionId(positionId, userId, (err, trades) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(trades);
        });
    },

    deleteTrade: (req: Request, res: Response) => {
        const userId = req.user.id;
        const tradeId = parseInt(req.params.id, 10);
        TradeModel.delete(tradeId, userId, (err, result) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            if (result.changes === 0) {
                return res.status(404).send('Trade not found or user not authorized');
            }
            res.status(204).send();
        });
    },

    incrementPosition: (req: Request, res: Response) => {
        const userId = req.user.id;
        const tradeId = parseInt(req.params.id, 10);
        const { increment_quantity, increment_price, increment_date } = req.body;

        if (!increment_quantity || !increment_price || !increment_date || increment_quantity <= 0) {
            return res.status(400).json({ message: 'Increment quantity, price, and date are required, and quantity must be positive.' });
        }

        TradeModel.find(tradeId, userId, (err, originalTrade) => {
            if (err || !originalTrade) {
                return res.status(500).json({ error: err ? err.message : 'Original trade not found or user not authorized' });
            }

            const original_quantity = originalTrade.quantity;
            const original_entry_price = originalTrade.entry_price;

            const new_quantity = original_quantity + increment_quantity;
            const new_avg_price = ((original_quantity * original_entry_price) + (increment_quantity * increment_price)) / new_quantity;

            const updatedTrade: Trade = {
                ...originalTrade,
                quantity: new_quantity,
                entry_price: new_avg_price
            };

            TradeModel.update(tradeId, userId, updatedTrade, (err, updateResult) => {
                if (err) {
                    return res.status(500).json({ error: `Error updating original trade: ${err.message}` });
                }

                const incrementLogTrade: Trade = {
                    ticker: originalTrade.ticker,
                    type: 'Buy',
                    entry_date: increment_date,
                    entry_price: increment_price,
                    quantity: increment_quantity,
                    position_id: originalTrade.position_id,
                    observations: `Increment to trade #${tradeId}`
                };

                TradeModel.create(incrementLogTrade, userId, (err, createResult) => {
                    if (err) {
                        return res.status(500).json({ error: `Error creating increment log trade: ${err.message}` });
                    }
                    res.status(200).json({ message: 'Position incremented successfully.' });
                });
            });
        });
    },

    createPartialExit: (req: Request, res: Response) => {
        const userId = req.user.id;
        const tradeId = parseInt(req.params.id, 10);
        const { exit_quantity, exit_price, exit_date } = req.body;

        if (!exit_quantity || !exit_price || !exit_date || exit_quantity <= 0) {
            return res.status(400).json({ message: 'Exit quantity, price, and date are required, and quantity must be positive.' });
        }

        TradeModel.find(tradeId, userId, (err, originalTrade) => {
            if (err || !originalTrade) {
                return res.status(500).json({ error: err ? err.message : 'Original trade not found or user not authorized' });
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

            TradeModel.create(partialTradeToCreate, userId, (err, createResult) => {
                if (err) {
                    return res.status(500).json({ error: `Error creating partial trade: ${err.message}` });
                }

                const new_quantity = originalTrade.quantity - exit_quantity;

                if (new_quantity > 0) {
                    const updatedOriginalTrade: Trade = { ...originalTrade, quantity: new_quantity };
                    TradeModel.update(tradeId, userId, updatedOriginalTrade, (err, updateResult) => {
                        if (err) {
                            return res.status(500).json({ error: `Error updating original trade: ${err.message}` });
                        }
                        res.status(200).json({ message: 'Partial exit executed successfully.' });
                    });
                } else {
                    TradeModel.delete(tradeId, userId, (err, deleteResult) => {
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