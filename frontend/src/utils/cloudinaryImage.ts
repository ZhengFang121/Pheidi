interface CloudinaryThumbnailOptions {
  width: number
  height: number
}

export const getCloudinaryThumbnailUrl = (
  imageUrl: string,
  { width, height }: CloudinaryThumbnailOptions,
) => {
  try {
    const url = new URL(imageUrl)

    if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes('/image/upload/')) {
      return imageUrl
    }

    const transformation = `f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}`
    url.pathname = url.pathname.replace('/image/upload/', `/image/upload/${transformation}/`)

    return url.toString()
  } catch {
    return imageUrl
  }
}
