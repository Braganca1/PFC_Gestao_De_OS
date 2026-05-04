import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');

const TIPOS_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const TAMANHO_MAX = 10 * 1024 * 1024;

function sanitizar(nome: string): string {
  const base = nome.replace(/\.[^.]+$/, '');
  return base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 60);
}

export const multerConfig = {
  storage: diskStorage({
    destination: (req, _file, cb) => {
      const osId = req.params.osId;
      const dir = join(UPLOADS_ROOT, String(osId));
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname);
      const nome = sanitizar(file.originalname);
      cb(null, `${Date.now()}_${nome}${ext}`);
    },
  }),
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
