import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { User } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// Registrar novo usuário
export const register = (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
    db.run(sql, [email, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Este email já está em uso.' });
            }
            return res.status(500).json({ message: 'Erro ao registrar usuário.', error: err.message });
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: this.lastID });
    });
};

// Login de usuário
export const login = (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, user: User) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor.', error: err.message });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '1d', // Token expira em 1 dia
        });

        res.json({ message: 'Login bem-sucedido!', token });
    });
}; 