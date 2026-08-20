import { Router } from 'express'
import multer from 'multer'
import type {
  UploadApiResponse,
} from 'cloudinary'

import cloudinary from '../config/cloudinary.js'
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/authMiddleware.js'

const router = Router()

const maximumImageSize = 5 * 1024 * 1024

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maximumImageSize,
    files: 1,
  },
})

const uploadArticleCover = (
  buffer: Buffer,
) => {
  return new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: 'pheidi/articles',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            transformation: [
              {
                width: 1600,
                height: 900,
                crop: 'limit',
                quality: 'auto',
              },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error)
              return
            }

            if (!result) {
              reject(
                new Error(
                  'Cloudinary 沒有回傳上傳結果',
                ),
              )
              return
            }

            resolve(result)
          },
        )

      uploadStream.end(buffer)
    },
  )
}

router.use(authenticateToken, requireAdmin)

router.post(
  '/article-cover',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          message: '請選擇要上傳的圖片',
        })
        return
      }

      if (
        !allowedImageTypes.has(
          req.file.mimetype,
        )
      ) {
        res.status(400).json({
          message:
            '封面圖片只支援 JPG、PNG、WebP 或 GIF',
        })
        return
      }

      const result = await uploadArticleCover(
        req.file.buffer,
      )

      res.status(201).json({
        message: '封面圖片上傳成功',
        image: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      })
    } catch (error: unknown) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            message:
              '封面圖片不能超過 5 MB',
          })
          return
        }

        res.status(400).json({
          message: '圖片上傳格式不正確',
        })
        return
      }

      console.error(
        'Failed to upload article cover:',
        error,
      )

      res.status(500).json({
        message: '封面圖片上傳失敗',
      })
    }
  },
)

export default router