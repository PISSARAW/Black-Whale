import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  )

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // API versioning
  app.enableVersioning({ type: VersioningType.URI })

  // CORS is restricted in production; development remains convenient locally.
  const webOrigin = process.env['WEB_ORIGIN']
  app.enableCors({ origin: webOrigin ? webOrigin.split(',').map((origin) => origin.trim()) : true })

  const fastify = app.getHttpAdapter().getInstance()
  fastify.addHook('onSend', async (_request: unknown, reply: { header: (name: string, value: string) => void }) => {
    reply.header('x-content-type-options', 'nosniff')
    reply.header('x-frame-options', 'DENY')
    reply.header('referrer-policy', 'same-origin')
    reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  })

  // Swagger docs
  if (process.env['NODE_ENV'] !== 'production' || process.env['ENABLE_API_DOCS'] === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Black Whale API')
      .setDescription('Temporal narrative engine for the Hunter × Hunter Succession Arc')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)
  }

  await app.listen(process.env['PORT'] ?? 3001, '0.0.0.0')
}

bootstrap()
