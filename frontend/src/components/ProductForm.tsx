import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { z } from 'zod'
import { Field } from './Field'
import { Spinner } from './Spinner'
import { Icon } from './Icon'
import {
  uploadProductImage,
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from '../api/uploads'
import { errorMessage } from '../api/client'
import { CATEGORIES, type ProductCategory, type ProductInput } from '../types'

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().min(1, 'Description is required'),
  category: z.enum(['mobile', 'laptop', 'accessory', 'other']),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int('Stock must be a whole number').nonnegative('Stock cannot be negative'),
  // Either an external URL or a path from our own upload endpoint.
  imageUrl: z
    .union([
      z.string().url(),
      z.string().regex(/^\/uploads\/[A-Za-z0-9._-]+$/),
    ])
    .optional()
    .or(z.literal('')),
})

interface ProductFormProps {
  initial?: Partial<ProductInput>
  submitLabel: string
  busy?: boolean
  onSubmit: (input: ProductInput) => void
}

export function ProductForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<ProductCategory>(
    initial?.category ?? 'other',
  )
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [stock, setStock] = useState(initial?.stock?.toString() ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Choose a JPEG, PNG, WebP or GIF image')
    } else if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('Image must be under 5 MB')
    } else {
      setUploadError('')
      setUploading(true)
      try {
        setImageUrl(await uploadProductImage(file))
      } catch (err) {
        setUploadError(errorMessage(err, 'Upload failed'))
      } finally {
        setUploading(false)
      }
    }
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({
      name,
      description,
      category,
      price: Number(price),
      stock: Number(stock),
      imageUrl: imageUrl.trim(),
    })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    const { imageUrl: url, ...rest } = parsed.data
    onSubmit({ ...rest, ...(url ? { imageUrl: url } : {}) })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="product-form">
      <Field label="Name" error={errors.name}>
        {({ id, describedBy }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>

      <Field label="Description" error={errors.description}>
        {({ id, describedBy }) => (
          <textarea
            id={id}
            aria-describedby={describedBy}
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>

      <div className="form-row">
        <Field label="Category" error={errors.category}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Price (Rs)" error={errors.price}>
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          )}
        </Field>

        <Field label="Stock" error={errors.stock}>
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              className="input"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="field">
        <span className="field-label" id="product-image-label">
          Product image
        </span>

        <div className="image-upload" aria-labelledby="product-image-label">
          <div className="image-upload-preview">
            {imageUrl ? (
              <img src={imageUrl} alt="Selected product" />
            ) : (
              <span className="image-upload-empty">
                <Icon name="image" size={26} />
              </span>
            )}
          </div>

          <div className="image-upload-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFile}
              className="sr-only"
              id="product-image-input"
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Spinner label="Uploading" />
              ) : (
                <>
                  <Icon name="upload" size={15} />
                  {imageUrl ? 'Replace image' : 'Upload image'}
                </>
              )}
            </button>
            {imageUrl && !uploading && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setImageUrl('')
                  setUploadError('')
                }}
              >
                <Icon name="trash" size={15} />
                Remove
              </button>
            )}
            <p className="field-hint">
              JPEG, PNG, WebP or GIF · max 5 MB. Optional — a placeholder is used
              if empty.
            </p>
          </div>
        </div>

        {(uploadError || errors.imageUrl) && (
          <p className="field-error" role="alert">
            {uploadError || errors.imageUrl}
          </p>
        )}
      </div>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? <Spinner label="Saving" /> : submitLabel}
      </button>
    </form>
  )
}
