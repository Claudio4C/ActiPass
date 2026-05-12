import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) { mkdirSync(UPLOAD_DIR, { recursive: true }) }
          cb(null, UPLOAD_DIR)
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`)
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/)) {
          cb(new BadRequestException('Seules les images sont acceptées (JPG, PNG, WebP, GIF)'), false)
          return
        }
        cb(null, true)
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) { throw new BadRequestException('Aucun fichier reçu') }

    // Construit l'URL publique à partir de l'hôte de la requête
    const protocol = req.protocol
    const host = req.get('host') ?? `localhost:${process.env.PORT ?? 3000}`
    const url = `${protocol}://${host}/uploads/${file.filename}`

    return { url, filename: file.filename, size: file.size }
  }
}
