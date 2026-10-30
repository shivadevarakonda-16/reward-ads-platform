import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reward_ads_platform',
  DB_NAME: process.env.DB_NAME || 'reward_ads_platform',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_antigravity_platform_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim()),
  MIN_WATCH_PERCENT: parseFloat(process.env.MIN_WATCH_PERCENT || '90'),
  MAX_ADS_PER_USER_PER_DAY: parseInt(process.env.MAX_ADS_PER_USER_PER_DAY || '30', 10),
  MIN_WITHDRAWAL_AMOUNT: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '100'),
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL || 'admin@rewardads.test',
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD || 'Admin@12345'
};
