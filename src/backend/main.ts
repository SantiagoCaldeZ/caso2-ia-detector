import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = Number(process.env.BACKEND_PORT ?? 3000);

  await app.listen(port);

  console.log(`IA Detector backend running on http://localhost:${port}/api`);
}

void bootstrap();