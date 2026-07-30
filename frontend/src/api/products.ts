import { api } from './client'
import type { Product, ProductInput, ProductList } from '../types'

export async function listProducts(
  page = 1,
  limit = 20,
): Promise<ProductList> {
  const { data } = await api.get<ProductList>('/products', {
    params: { page, limit },
  })
  return data
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<{ product: Product }>(`/products/${id}`)
  return data.product
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post<{ product: Product }>('/products', input)
  return data.product
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  const { data } = await api.patch<{ product: Product }>(
    `/products/${id}`,
    input,
  )
  return data.product
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}
