import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EnviarEmailParams {
  to: string[];
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async enviar({ to, subject, html }: EnviarEmailParams): Promise<void> {
    if (to.length === 0) return;

    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY no configurada, no se envió "${subject}" a ${to.join(', ')}`);
      return;
    }

    try {
      const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Arriendo365 <no-reply@arriendo365.com>',
          to,
          subject,
          html,
        }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        this.logger.error(`Error al enviar email "${subject}": ${respuesta.status} ${detalle}`);
      }
    } catch (err) {
      this.logger.error(`Error de red al enviar email "${subject}"`, err);
    }
  }
}
