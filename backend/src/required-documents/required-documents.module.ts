import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { StorageModule } from '../storage/storage.module'
import { RequiredDocumentsController } from './required-documents.controller'
import { RequiredDocumentsService } from './required-documents.service'

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [RequiredDocumentsController],
  providers: [RequiredDocumentsService],
  exports: [RequiredDocumentsService],
})
export class RequiredDocumentsModule {}
