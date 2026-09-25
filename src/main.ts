// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Enable CORS for ESP32 and dashboard clients
  app.enableCors();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Fingerprint Electronic Voting System API')
    .setDescription('Phase 1 Backend API Documentation for ESP32-S3 and Admin Dashboard')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter admin access token',
        in: 'header',
      },
      ('JWT-auth'), // This name matches the @ApiBearerAuth() decorator
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger Docs available at: http://localhost:3000/api/docs`);
}
bootstrap();