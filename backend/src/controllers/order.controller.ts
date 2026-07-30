import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { logger } from "../utils/logger";
import { broadcast } from "../services/events.service";

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.createOrder(req.session.userId!, req.body);
    // Stock changed too, so nudge both dashboards.
    broadcast("orders:changed", { action: "created" });
    broadcast("products:changed", { action: "stock" });
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.listMine(req.session.userId!);
    res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
}

async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.listAll();
    res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    logger.info("Admin updated order status", {
      by: req.session.userId,
      orderId: req.params.id,
      status: req.body.status,
    });
    broadcast("orders:changed", { action: "status" });
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

export const orderController = { create, listMine, listAll, updateStatus };
