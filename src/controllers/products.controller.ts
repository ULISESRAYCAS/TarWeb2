import { Request, Response } from 'express';
import { pool } from '../conf/dbConnection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Funciones auxiliares para validar datos
const isValidId = (id: number) => !isNaN(id) && id > 0;
const isValidPrice = (price: number) => !isNaN(price) && price > 0;

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE active = TRUE');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    if (!isValidId(id)) {
        res.status(400).json({ message: 'ID de producto inválido' }); return;
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? AND active = TRUE', [id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado o inactivo' }); return;
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    const { name, price, stock, description, brand, img } = req.body;

    if (!name || !price || stock === undefined || !description) {
        res.status(400).json({ message: 'Faltan campos obligatorios' }); return;
    }
    if (!isValidPrice(Number(price))) {
        res.status(400).json({ message: 'El precio debe ser mayor a cero' }); return;
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price, stock, description, brand || null, img || null]
        );
        res.status(201).json({ message: 'Producto creado', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear producto' });
    }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { name, price, stock, description, brand, img } = req.body;

    if (!isValidId(id)) {
        res.status(400).json({ message: 'ID inválido' }); return;
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE products SET name=?, price=?, stock=?, description=?, brand=?, img=? WHERE id=? AND active=TRUE',
            [name, price, stock, description, brand, img, id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado' }); return;
        }
        res.status(200).json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    if (!isValidId(id)) {
        res.status(400).json({ message: 'ID inválido' }); return;
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE products SET active = FALSE WHERE id = ? AND active = TRUE',
            [id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado o ya inactivo' }); return;
        }
        res.status(200).json({ message: 'Baja lógica exitosa' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const changeProductPrice = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { price } = req.body;

    if (!isValidId(id) || !isValidPrice(Number(price))) {
        res.status(400).json({ message: 'Datos inválidos' }); return;
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE products SET price = ? WHERE id = ? AND active = TRUE',
            [price, id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado' }); return;
        }
        res.status(200).json({ message: 'Precio actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};