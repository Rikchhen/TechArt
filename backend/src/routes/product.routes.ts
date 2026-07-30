import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { validateObjectId } from "../middlewares/validateObjectId";
import { CreateProductDto, UpdateProductDto } from "../dtos/product.dto";

const router = Router();

router.get("/", productController.list);
router.get("/:id", validateObjectId(), productController.getOne);

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(CreateProductDto),
  productController.create
);
router.patch(
  "/:id",
  validateObjectId(),
  requireAuth,
  requireRole("admin"),
  validate(UpdateProductDto),
  productController.update
);
router.delete(
  "/:id",
  validateObjectId(),
  requireAuth,
  requireRole("admin"),
  productController.remove
);

export default router;
