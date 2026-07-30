import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { validateObjectId } from "../middlewares/validateObjectId";
import { CreateOrderDto, UpdateOrderStatusDto } from "../dtos/order.dto";

const router = Router();

router.post("/", requireAuth, validate(CreateOrderDto), orderController.create);
router.get("/mine", requireAuth, orderController.listMine);
router.get("/", requireAuth, requireRole("admin"), orderController.listAll);
router.patch(
  "/:id/status",
  validateObjectId(),
  requireAuth,
  requireRole("admin"),
  validate(UpdateOrderStatusDto),
  orderController.updateStatus
);

export default router;
