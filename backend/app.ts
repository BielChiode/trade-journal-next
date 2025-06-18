import express from 'express';
import cors from 'cors';
import tradeController from './controllers/tradeController';
import './db/database'; // Garante que a conexão com o BD seja iniciada

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.get('/api/trades', tradeController.getAllTrades);
app.post('/api/trades', tradeController.addTrade);
app.put('/api/trades/:id', tradeController.updateTrade);
app.delete('/api/trades/:id', tradeController.deleteTrade);

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
}); 