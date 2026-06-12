import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables from .env
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'prwm_admin',
  password: process.env.DB_PASSWORD || 'prwm_dev_2026',
  database: process.env.DB_DATABASE || 'payment_request_db',
  entities: [path.join(__dirname, 'src/modules/shared/entities/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
