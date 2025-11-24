import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), EmailModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
