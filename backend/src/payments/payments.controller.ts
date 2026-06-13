import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CheckoutSchema } from './dto/checkout.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  private userId(req: Request): string {
    return req.user?.['sub'] as string;
  }

  /** POST /payments/checkout */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  checkout(@Body() body: unknown, @Req() req: Request) {
    const dto = CheckoutSchema.parse(body);
    return this.service.checkout(dto, this.userId(req));
  }

  /** GET /payments/my/:orgId */
  @Get('my/:orgId')
  getMyPayments(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.service.getMyPayments(orgId, this.userId(req));
  }

  /** GET /payments/admin/:orgId */
  @Get('admin/:orgId')
  getAdminPayments(
    @Param('orgId') orgId: string,
    @Query('status') status: string | undefined,
    @Query('userId') filterUserId: string | undefined,
    @Req() req: Request
  ) {
    return this.service.getAdminPayments(orgId, this.userId(req), { status, userId: filterUserId });
  }

  /** GET /payments/:paymentId/receipt-url */
  @Get(':paymentId/receipt-url')
  getReceiptUrl(@Param('paymentId') paymentId: string, @Req() req: Request) {
    return this.service.getReceiptUrl(paymentId, this.userId(req));
  }

  /** POST /payments/:paymentId/refund */
  @Post(':paymentId/refund')
  @HttpCode(HttpStatus.OK)
  refund(@Param('paymentId') paymentId: string, @Req() req: Request) {
    return this.service.refund(paymentId, this.userId(req));
  }
}
