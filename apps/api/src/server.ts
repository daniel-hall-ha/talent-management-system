import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './common/config.js';
import { errorHandler } from './common/http.js';
import { registerRoutes } from './routes.js';

const app = express();
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());
registerRoutes(app);
app.use(errorHandler);
app.listen(config.port, () => console.log(`API listening on ${config.port}`));
