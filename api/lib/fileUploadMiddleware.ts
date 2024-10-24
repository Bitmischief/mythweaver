import { S3Client } from '@aws-sdk/client-s3';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  region: 'sfo3',
});

export interface FileUploadSettings {
  maxFileSize: number;
  acceptedFileTypes: string[];
}

export const useBuildFileUploader = (opts: FileUploadSettings) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: 'mythweaver-assets',
      key: function (req: Request, file: any, cb: any) {
        const fileId = uuidv4();
        cb(null, `${fileId}.${file.originalname.split('.').pop()}`);
      },
      acl: 'public-read',
    }),
    limits: {
      fileSize: opts.maxFileSize,
    },
    fileFilter: function (req: Request, file: any, cb: any) {
      if (!opts.acceptedFileTypes.includes(file.mimetype)) {
        return cb(
          new Error(
            `Provided file type of ${file.mimetype}, but only ${opts.acceptedFileTypes.join(', ')} formats are allowed!`,
          ),
        );
      }
      cb(null, true);
    },
  });
};

export const useUpload = (filename: string, opts: FileUploadSettings) => {
  const uploader = useBuildFileUploader(opts).single(filename);
  
  return (req: Request, res: Response, next: NextFunction) => {
    uploader(req, res, (err: any) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};
