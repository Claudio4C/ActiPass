import { Injectable, HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Trop de tentatives. Veuillez réessayer dans une minute.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
