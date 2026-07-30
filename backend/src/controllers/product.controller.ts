import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { logger } from "../utils/logger";
import { broadcast } from "../services/events.service";

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await productService.list(page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getById(req.params.id);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.create(req.body);
    logger.info("Admin created product", {
      by: req.session.userId,
      productId: product._id.toString(),
    });
    broadcast("products:changed", { action: "created" });
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.update(req.params.id, req.body);
    logger.info("Admin updated product", {
      by: req.session.userId,
      productId: req.params.id,
    });
    broadcast("products:changed", { action: "updated" });
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.remove(req.params.id);
    logger.info("Admin deleted product", {
      by: req.session.userId,
      productId: req.params.id,
    });
    broadcast("products:changed", { action: "deleted" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export const productController = { list, getOne, create, update, remove };
