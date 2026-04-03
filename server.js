import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize MySQL Connection Pool
// We use a pool to manage multiple connections efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Khoa1612',
  database: process.env.DB_NAME || 'aurabrew_db', // Updated to match the new database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await pool.query('SELECT 1');
      res.json({ status: 'ok', message: 'Server is running and database is connected' });
    } catch (error) {
      console.error('Database connection failed:', error);
      res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
    }
  });

  // Get user profile
  app.get('/api/users/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  });

  // Get user orders
  app.get('/api/orders/user/:userId', async (req, res) => {
    try {
      const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
      
      // Fetch items for each order
      for (let order of orders) {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }
      
      res.json(orders);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database error', details: error.message });
    }
  });

  // Create a new order
  app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { user_id, total_amount, shipping_address, payment_method, items } = req.body;
      
      // Insert order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?)',
        [user_id, total_amount, shipping_address, payment_method]
      );
      
      const orderId = orderResult.insertId;
      
      // Insert order items
      for (let item of items) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, product_name, quantity, price, options) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.id, item.name, item.quantity, item.price, item.options ? item.options.join(', ') : '']
        );
      }
      
      await connection.commit();
      res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
      await connection.rollback();
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to create order', details: error.message });
    } finally {
      connection.release();
    }
  });

  // Catch-all for unmatched API routes to return JSON instead of HTML
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
