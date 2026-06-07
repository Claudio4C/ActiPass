import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  CreateRequiredDocumentSchema,
  UpdateRequiredDocumentSchema,
  type CreateRequiredDocumentDto,
  type UpdateRequiredDocumentDto,
} from './dto/required-document.dto'
import { RequiredDocumentsService } from './required-documents.service'

@Controller('organisations/:orgId/required-documents')
@UseGuards(JwtAuthGuard)
export class RequiredDocumentsController {
  constructor(private readonly service: RequiredDocumentsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string
  }

  /** GET /organisations/:orgId/required-documents */
  @Get()
  findAll(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.findAll(orgId, this.userId(req))
  }

  /**
   * POST /organisations/:orgId/required-documents/seed-defaults
   * MUST be declared before :id to avoid route conflict.
   */
  @Post('seed-defaults')
  @HttpCode(HttpStatus.OK)
  seedDefaults(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.seedDefaults(orgId, this.userId(req))
  }

  /** POST /organisations/:orgId/required-documents */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('orgId') orgId: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = CreateRequiredDocumentSchema.parse(body) as CreateRequiredDocumentDto
    return this.service.create(orgId, dto, this.userId(req))
  }

  /** PATCH /organisations/:orgId/required-documents/:id */
  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const dto = UpdateRequiredDocumentSchema.parse(body) as UpdateRequiredDocumentDto
    return this.service.update(orgId, id, dto, this.userId(req))
  }

  /** DELETE /organisations/:orgId/required-documents/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.service.remove(orgId, id, this.userId(req))
  }
}
