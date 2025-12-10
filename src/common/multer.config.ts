import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads';
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
};

export const videoMulterConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/videos';
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for videos
  },
};
