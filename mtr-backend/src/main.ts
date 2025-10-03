import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

async function bootstrap() {
  const key = fs.readFileSync(
    path.join(process.cwd(), 'certs', 'localhost-key.pem'),
  );
  const cert = fs.readFileSync(
    path.join(process.cwd(), 'certs', 'localhost.pem'),
  );
  const PORT = process.env.PORT || 3001;
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    httpsOptions: { key, cert },
  });

  app.use(cookieParser());

  app.enableCors({
    origin: ['https://localhost:3000'], // ← указать фронтенд прода
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Увеличиваем лимиты тела запроса (подберите под ваши файлы)
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // Сжатие ответов (не влияет на 413, но ускорит сеть)
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
