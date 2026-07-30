import { ProductModel } from "../models/product.model";
import { CreateProductInput, UpdateProductInput } from "../dtos/product.dto";

export const productRepository = {
  findById(id: string) {
    return ProductModel.findById(id);
  },

  findAll(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;
    return ProductModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);
  },

  count() {
    return ProductModel.countDocuments();
  },

  create(data: CreateProductInput) {
    return ProductModel.create(data);
  },

  updateById(id: string, fields: UpdateProductInput) {
    return ProductModel.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true, runValidators: true }
    );
  },

  deleteById(id: string) {
    return ProductModel.findByIdAndDelete(id);
  },

  decrementStock(id: string, quantity: number) {
    return ProductModel.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true }
    );
  },
};
