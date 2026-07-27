import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

const isProduction = process.env['NODE_ENV'] === 'production'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      // Caddy is the only hop in front of the API, so exactly one forwarded hop
      // is trusted. Without this every request looks like it comes from the
      // Docker bridge and the rate limiter buckets the whole internet together.
      trustProxy: 1,
      // The largest legitimate body is a simulation action payload (8 KiB cap).
      bodyLimit: 64 * 1024,
    }),
  )

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // Validation messages echo the rejected input; keep them out of production
      // responses so the API never reflects attacker-controlled content back.
      disableErrorMessages: isProduction,
    }),
  )

  // API versioning
  app.enableVersioning({ type: VersioningType.URI })

  // CORS is restricted in production; development remains convenient locally.
  // `validateEnvironment` guarantees WEB_ORIGIN is set in production, so the
  // permissive fallback can only ever apply to local development.
  const webOrigin = process.env['WEB_ORIGIN']
  const allowedOrigins = webOrigin
    ? webOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : !isProduction,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-spoiler-limit'],
    maxAge: 600,
  })

  const fastify = app.getHttpAdapter().getInstance()
  fastify.addHook(
    'onSend',
    async (
      request: { url?: string },
      reply: { header: (name: string, value: string) => void },
    ) => {
      reply.header('x-content-type-options', 'nosniff')
      reply.header('x-frame-options', 'DENY')
      reply.header('referrer-policy', 'same-origin')
      reply.header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
      reply.header('cross-origin-resource-policy', 'same-site')
      reply.header('x-robots-tag', 'noindex, nofollow')
      if (isProduction) {
        reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
      }
      // Every API response is JSON: nothing it returns should be able to load a
      // subresource, be framed, or submit a form. Swagger UI is the one route
      // that serves an actual document and needs its own assets.
      const isDocs = (request.url ?? '').startsWith('/docs')
      reply.header(
        'content-security-policy',
        isDocs
          ? "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
          : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      )
    },
  )

  // Swagger docs
  if (!isProduction || process.env['ENABLE_API_DOCS'] === 'true') {
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
