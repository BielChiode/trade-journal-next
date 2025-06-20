import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// Estendendo a interface Request do Express para incluir a propriedade 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any; 
        }
    }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Pega o token do header 'Authorization: Bearer TOKEN'
            token = req.headers.authorization.split(' ')[1];

            // Verifica o token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Anexa o usuário decodificado à requisição
            req.user = decoded;
            
            next();
        } catch (error) {
            console.error('Erro na autenticação do token', error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, sem token.' });
    }
}; 