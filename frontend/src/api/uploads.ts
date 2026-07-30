import { api } from './client'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

/**
 * Uploads a product image (admin only) and returns the stored path,
 * e.g. "/uploads/9f3c….jpg", ready to save as the product's imageUrl.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post<{ url: string }>('/uploads/image', form, {
    // Let the browser set the multipart boundary itself.
    headers: { 'Content-Type': undefined },
  })
  return data.url
}
