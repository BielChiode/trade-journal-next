import express from 'express';
import cors from 'cors';
import tradeController from './controllers/tradeController';
import * as authController from './controllers/authController';
import { protect } from './middleware/authMiddleware';
import './db/database'; // Ensures the DB connection is initiated

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const router = express.Router();

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// API Routes (Protegidas)
router.get('/trades', protect, tradeController.getAllTrades);
router.get('/trades/position/:positionId', protect, tradeController.getTradesByPositionId);
router.post('/trades', protect, tradeController.addTrade);
router.put('/trades/:id', protect, tradeController.updateTrade);
router.post('/trades/:id/partial-exit', protect, tradeController.createPartialExit);
router.post('/trades/:id/increment', protect, tradeController.incrementPosition);
router.delete('/trades/:id', protect, tradeController.deleteTrade);

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
}); 