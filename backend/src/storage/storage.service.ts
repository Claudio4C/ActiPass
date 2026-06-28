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
  private readonly client: S3Client | null
  private readonly bucket: string | null
  private readonly enabled: boolean

  constructor(private readonly config: ConfigService) {
    const bucket = config.get<string>('OVH_S3_BUCKET')
    const region = config.get<string>('OVH_S3_REGION')
    const endpoint = config.get<string>('OVH_S3_ENDPOINT')
    const accessKeyId = config.get<string>('OVH_S3_ACCESS_KEY')
    const secretAccessKey = config.get<string>('OVH_S3_SECRET_KEY')

    const isConfigured =
      Boolean(bucket && region && endpoint && accessKeyId && secretAccessKey)

    if (!isConfigured) {
      this.enabled = false
      this.client = null
      this.bucket = null
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'Configuration OVH S3 incomplète : OVH_S3_BUCKET, OVH_S3_REGION, OVH_S3_ENDPOINT, OVH_S3_ACCESS_KEY et OVH_S3_SECRET_KEY sont requis.',
        )
      }
      this.logger.warn(
        'OVH S3 non configuré — uploads de documents désactivés en local. ' +
          'Copiez les variables OVH_S3_* depuis .env.example vers .env.',
      )
      return
    }

    this.enabled = true
    this.bucket = bucket!
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    })
  }

  private requireStorage(): { client: S3Client; bucket: string } {
    if (!this.enabled || !this.client || !this.bucket) {
      throw new InternalServerErrorException(
        'Stockage fichiers indisponible — configurez OVH_S3_* dans .env (voir .env.example).',
      )
    }
    return { client: this.client, bucket: this.bucket }
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
    const { client, bucket } = this.requireStorage()
    try {
      await client.send(
        new PutObjectCommand({
          Bucket:             bucket,
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
    const { client, bucket } = this.requireStorage()
    try {
      return await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
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
    const { client, bucket } = this.requireStorage()
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
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
