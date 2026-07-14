import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const TIPOS_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const TAMANHO_MAX = 10 * 1024 * 1024;

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      cb(
        new BadRequestException(
          `Tipo de arquivo não permitido: ${file.mimetype}`,
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: TAMANHO_MAX },
};
