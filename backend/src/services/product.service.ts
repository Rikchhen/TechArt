import { productRepository } from "../repositories/product.repository";
import { CreateProductInput, UpdateProductInput } from "../dtos/product.dto";
import { AppError } from "../utils/appError";

async function list(page: number, limit: number) {
  const [items, total] = await Promise.all([
    productRepository.findAll(page, limit),
    productRepository.count(),
  ]);
  return { items, total, page, limit };
}

async function getById(id: string) {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
}

async function create(dto: CreateProductInput) {
  return productRepository.create(dto);
}

async function update(id: string, dto: UpdateProductInput) {
  const product = await productRepository.updateById(id, dto);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
}

async function remove(id: string) {
  const product = await productRepository.deleteById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
}

export const productService = { list, getById, create, update, remove };
