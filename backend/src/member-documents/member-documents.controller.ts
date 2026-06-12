import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ReviewDocumentSchema, type ReviewDocumentDto } from './dto/member-document.dto'
import { MemberDocumentsService } from './member-documents.service'

@Controller('organisations/:orgId')
@UseGuards(JwtAuthGuard)
export class MemberDocumentsController {
  constructor(private readonly service: MemberDocumentsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string
  }

  /** POST /organisations/:orgId/members/me/documents */
  @Post('members/me/documents')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('requiredDocumentId') requiredDocumentId: string,
    @Req() req: Request,
  ) {
    return this.service.upload(orgId, this.userId(req), requiredDocumentId, file)
  }

  /** GET /organisations/:orgId/members/me/documents */
  @Get('members/me/documents')
  findMine(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.findMine(orgId, this.userId(req))
  }

  /** GET /organisations/:orgId/documents?status=pending|approved|rejected */
  @Get('documents')
  findAll(
    @Param('orgId') orgId: string,
    @Query('status') status: string | undefined,
    @Req() req: Request,
  ) {
    return this.service.findAll(orgId, this.userId(req), status)
  }

  /** GET /organisations/:orgId/documents/:docId/signed-url */
  @Get('documents/:docId/signed-url')
  getSignedUrl(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @Req() req: Request,
  ) {
    return this.service.getSignedUrl(orgId, docId, this.userId(req))
  }

  /** PATCH /organisations/:orgId/documents/:docId/review */
  @Patch('documents/:docId/review')
  review(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = ReviewDocumentSchema.parse(body) as ReviewDocumentDto
    return this.service.review(orgId, docId, dto, this.userId(req))
  }

  /** GET /organisations/:orgId/compliance */
  @Get('compliance')
  getCompliance(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getCompliance(orgId, this.userId(req))
  }
}
