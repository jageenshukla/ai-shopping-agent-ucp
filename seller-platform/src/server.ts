import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import discoveryRouter from './routes/discovery';
import checkoutRouter from './routes/checkout';
import productsRouter from './routes/products';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('', discoveryRouter);

app.use('/api/v1', checkoutRouter);
app.use('/api/v1', productsRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     UCP Seller Platform - Server Running              ║
╠════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                        ║
║  UCP Discovery: http://localhost:${PORT}/.well-known/ucp    ║
║  Health Check:  http://localhost:${PORT}/health             ║
║  Products API:  http://localhost:${PORT}/api/v1/products    ║
║  Checkout API:  http://localhost:${PORT}/api/v1/checkout-sessions ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
