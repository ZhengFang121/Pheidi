import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import type { UploadApiResponse } from 'cloudinary'
import multer from 'multer'

import cloudinary from '../configs/cloudinary.js'

const maximumImageSize = 5 * 1024 * 1024

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maximumImageSize,
    files: 1,
  },
})

const uploadSingleImage: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          message: '圖片不能超過 5 MB',
        })
        return
      }

      res.status(400).json({
        message: '圖片上傳格式不正確',
      })
      return
    }

    if (error) {
      next(error)
      return
    }

    next()
  })
}

interface UploadImageOptions {
  folder: string
  width: number
  height: number
}

const uploadImage = (buffer: Buffer, { folder, width, height }: UploadImageOptions) => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [
          {
            width,
            height,
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
          reject(new Error('Cloudinary 沒有回傳上傳結果'))
          return
        }

        resolve(result)
      },
    )

    uploadStream.end(buffer)
  })
}

const isAllowedImage = (mimetype: string) => allowedImageTypes.has(mimetype)

const toImageResponse = (result: UploadApiResponse) => ({
  url: result.secure_url,
  publicId: result.public_id,
  width: result.width,
  height: result.height,
  format: result.format,
  bytes: result.bytes,
})

export const registerUploadHandlers = (router: Router) => {
  router.post('/article-cover', uploadSingleImage, async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          message: '請選擇要上傳的圖片',
        })
        return
      }

      if (!isAllowedImage(req.file.mimetype)) {
        res.status(400).json({
          message: '封面圖片只支援 JPG、PNG、WebP 或 GIF',
        })
        return
      }

      const result = await uploadImage(req.file.buffer, {
        folder: 'pheidi/articles',
        width: 1600,
        height: 900,
      })

      res.status(201).json({
        message: '封面圖片上傳成功',
        image: toImageResponse(result),
      })
    } catch (error: unknown) {
      console.error('Failed to upload article cover:', error)

      res.status(500).json({
        message: '封面圖片上傳失敗',
      })
    }
  })
}

export const registerPostUploadHandlers = (router: Router) => {
  router.post('/post-image', uploadSingleImage, async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({
          message: '請選擇要上傳的圖片',
        })
        return
      }

      if (!isAllowedImage(req.file.mimetype)) {
        res.status(400).json({
          message: '貼文圖片只支援 JPG、PNG、WebP 或 GIF',
        })
        return
      }

      const result = await uploadImage(req.file.buffer, {
        folder: 'pheidi/posts',
        width: 1600,
        height: 1600,
      })

      res.status(201).json({
        message: '貼文圖片上傳成功',
        image: toImageResponse(result),
      })
    } catch (error: unknown) {
      console.error('Failed to upload post image:', error)

      res.status(500).json({
        message: '貼文圖片上傳失敗',
      })
    }
  })
}
