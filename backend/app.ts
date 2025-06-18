import express from 'express';
import cors from 'cors';
import tradeController from './controllers/tradeController';
import './db/database'; // Ensures the DB connection is initiated

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const router = express.Router();

// API Routes
router.get('/trades', tradeController.getAllTrades);
router.get('/trades/position/:positionId', tradeController.getTradesByPositionId);
router.post('/trades', tradeController.addTrade);
router.put('/trades/:id', tradeController.updateTrade);
router.post('/trades/:id/partial-exit', tradeController.createPartialExit);
router.delete('/trades/:id', tradeController.deleteTrade);

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
}); 