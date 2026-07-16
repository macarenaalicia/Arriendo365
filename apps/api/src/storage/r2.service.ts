import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const URL_EXPIRACION_SEGUNDOS = 300;

// Cloudflare R2 da 10GB gratis por cuenta; dejamos margen para no pasarnos
// del plan free y empezar a pagar.
const LIMITE_ALMACENAMIENTO_BYTES = 9.5 * 1_000_000_000;

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

  private async obtenerUsoTotalBytes(bucket: string): Promise<number> {
    let total = 0;
    let continuationToken: string | undefined;

    do {
      const respuesta = await this.getClient().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }),
      );
      total += (respuesta.Contents ?? []).reduce((acc, obj) => acc + (obj.Size ?? 0), 0);
      continuationToken = respuesta.IsTruncated ? respuesta.NextContinuationToken : undefined;
    } while (continuationToken);

    return total;
  }

  async crearUrlSubida(
    carpeta: string,
    nombreArchivo: string,
    contentType: string,
    tamanioBytes: number,
  ) {
    const bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');

    const usoActual = await this.obtenerUsoTotalBytes(bucket);
    if (usoActual + tamanioBytes > LIMITE_ALMACENAMIENTO_BYTES) {
      throw new BadRequestException(
        'Se alcanzó el límite de almacenamiento disponible. Elimina archivos que ya no necesites antes de subir nuevos.',
      );
    }

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
