import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const URL_EXPIRACION_SEGUNDOS = 300;

@Injectable()
export class R2Service {
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): S3Client {
    if (!this.client) {
      const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
          secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
        },
      });
    }
    return this.client;
  }

  async crearUrlSubida(carpeta: string, nombreArchivo: string, contentType: string) {
    const bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    const key = `${carpeta}/${randomUUID()}-${nombreArchivo}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.getClient(), command, {
      expiresIn: URL_EXPIRACION_SEGUNDOS,
    });

    return {
      uploadUrl,
      key,
      archivoUrl: `https://${bucket}.r2.cloudflarestorage.com/${key}`,
    };
  }
}
