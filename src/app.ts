import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/.env';
import { AppError, errorMiddleware } from './middleware/error.middleware';
import approvalRoutes from './modules/approval/approval.routes';
import authRoutes from './modules/auth/auth.routes';
import notificationRoutes from './modules/notification/notification.routes';
import reimbursementRoutes from './modules/reimbursement/reimbursement.routes';
import reportingRoutes from './modules/reporting/reporting.routes';
import travelRoutes from './modules/travel/travel.routes';
import userRoutes from './modules/user/user.routes';
import { sendSuccess } from './utils/response';
import { uploadDir } from './utils/upload';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => {
  return sendSuccess(res, { status: 'ok', env: env.NODE_ENV, uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportingRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Endpoint tidak ditemukan', 404));
});

app.use(errorMiddleware);

export default app;
