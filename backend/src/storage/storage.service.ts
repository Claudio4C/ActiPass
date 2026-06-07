import * as path from 'path'
import { randomUUID } from 'crypto'

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { SIGNED_URL_EXPIRY_SECONDS } from './storage.constants'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: S3Client
  private readonly bucket: string

  constructor(private readonly config: ConfigService) {
    this.bucket  = config.getOrThrow<string>('OVH_S3_BUCKET')

    this.client = new S3Client({
      region:   config.getOrThrow<string>('OVH_S3_REGION'),
      endpoint: config.getOrThrow<string>('OVH_S3_ENDPOINT'),
      credentials: {
        accessKeyId:     config.getOrThrow<string>('OVH_S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('OVH_S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    })
  }

  /**
   * Upload a file buffer to object storage.
   * Returns the storage key (never the signed URL — store the key in DB).
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket:             this.bucket,
          Key:                key,
          Body:               buffer,
          ContentType:        mimeType,
          // Opens in browser instead of forcing a download
          ContentDisposition: 'inline',
        }),
      )
      return key
    } catch (err) {
      this.logger.error(`uploadFile failed for key="${key}"`, err)
      throw new InternalServerErrorException('Échec de l\'upload — réessayez.')
    }
  }

  /**
   * Generate a pre-signed GET URL valid for `expiresIn` seconds (default 15 min).
   * Call this at request time — never persist the URL.
   */
  async getSignedUrl(
    key: string,
    expiresIn: number = SIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn },
      )
    } catch (err) {
      this.logger.error(`getSignedUrl failed for key="${key}"`, err)
      throw new InternalServerErrorException('Impossible de générer le lien de visualisation.')
    }
  }

  /**
   * Delete a file from object storage.
   * S3-compatible stores return success even if the key doesn't exist — safe to call idempotently.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      )
    } catch (err) {
      this.logger.error(`deleteFile failed for key="${key}"`, err)
      throw new InternalServerErrorException('Impossible de supprimer le fichier.')
    }
  }

  /**
   * Build a deterministic, collision-free storage key.
   * Format: orgs/{orgId}/members/{memberId}/docs/{uuid}{.ext}
   */
  generateKey(orgId: string, memberId: string, originalName: string): string {
    const ext = path.extname(originalName).toLowerCase()
    return `orgs/${orgId}/members/${memberId}/docs/${randomUUID()}${ext}`
  }
}
