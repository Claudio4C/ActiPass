import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { StorageModule } from '../storage/storage.module'
import { MemberDocumentsController } from './member-documents.controller'
import { MemberDocumentsService } from './member-documents.service'

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [MemberDocumentsController],
  providers: [MemberDocumentsService],
  exports: [MemberDocumentsService],
})
export class MemberDocumentsModule {}
