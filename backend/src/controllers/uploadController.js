import cloudinary from '../config/cloudinary.js'
import { sendSuccess } from '../utils/response.js'

const upload_buffer = (buffer_value, folder_name) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder_name,
        resource_type: 'image'
      },
      (error_value, result_value) => {
        if (error_value) {
          reject(error_value)
          return
        }
        resolve(result_value)
      }
    )

    stream.end(buffer_value)
  })
}

export const uploadProductImages = async (req, res, next) => {
  try {
    const files = req.files || []
    if (files.length === 0) {
      const err = new Error('No image files uploaded')
      err.status = 400
      throw err
    }

    const uploads = await Promise.all(
      files.map(file_item => upload_buffer(file_item.buffer, 'aimforge/products'))
    )

    const image_urls = uploads.map(upload_item => upload_item.secure_url)

    return sendSuccess(res, { image_urls }, 'Images uploaded')
  } catch (err) {
    next(err)
  }
}

export const uploadCategoryImages = async (req, res, next) => {
  try {
    const files = req.files || []
    if (files.length === 0) {
      const err = new Error('No image files uploaded')
      err.status = 400
      throw err
    }

    const uploads = await Promise.all(
      files.map(file_item => upload_buffer(file_item.buffer, 'aimforge/categories'))
    )
    const image_urls = uploads.map(upload_item => upload_item.secure_url)

    return sendSuccess(res, { image_urls }, 'Images uploaded')
  } catch (err) {
    next(err)
  }
}

export const uploadBrandImages = async (req, res, next) => {
  try {
    const files = req.files || []
    if (files.length === 0) {
      const err = new Error('No image files uploaded')
      err.status = 400
      throw err
    }

    const uploads = await Promise.all(
      files.map(file_item => upload_buffer(file_item.buffer, 'aimforge/brands'))
    )
    const image_urls = uploads.map(upload_item => upload_item.secure_url)

    return sendSuccess(res, { image_urls }, 'Images uploaded')
  } catch (err) {
    next(err)
  }
}

export const uploadProfileAvatar = async (req, res, next) => {
  try {
    const files = req.files || []
    if (files.length === 0) {
      const err = new Error('No image files uploaded')
      err.status = 400
      throw err
    }

    const upload_result = await upload_buffer(
      files[0].buffer,
      'aimforge/avatars'
    )

    return sendSuccess(
      res,
      { avatar_url: upload_result.secure_url },
      'Avatar uploaded'
    )
  } catch (err) {
    next(err)
  }
}
