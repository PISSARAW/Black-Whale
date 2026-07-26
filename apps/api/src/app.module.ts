import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CharactersModule } from './modules/characters/characters.module.js'
import { ChaptersModule } from './modules/chapters/chapters.module.js'
import { WorldStateModule } from './modules/world-state/world-state.module.js'
import { PerspectivesModule } from './modules/perspectives/perspectives.module.js'
import { NenModule } from './modules/nen/nen.module.js'
import { SimulationsModule } from './modules/simulations/simulations.module.js'
import { MapModule } from './modules/map/map.module.js'
import { SourcesModule } from './modules/sources/sources.module.js'
import { PrismaModule } from './modules/prisma/prisma.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { validateEnvironment } from './configuration.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AuthModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CharactersModule,
    ChaptersModule,
    WorldStateModule,
    PerspectivesModule,
    NenModule,
    SimulationsModule,
    MapModule,
    SourcesModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
