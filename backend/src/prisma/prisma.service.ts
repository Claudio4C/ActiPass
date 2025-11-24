import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasourceUrl: configService.get<string>('DATABASE_URL'),
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      try {
        const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
          SELECT tablename FROM pg_tables WHERE schemaname='public'
        `;

        if (tablenames && tablenames.length > 0) {
          const tables = tablenames
            .map(({ tablename }) => tablename)
            .filter((name) => name !== '_prisma_migrations')
            .map((name) => `"public"."${name}"`)
            .join(', ');

          if (tables) {
            await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
          }
        }
      } catch (error) {
        console.log('Error cleaning database:', error);
      }
    }
  }
}
