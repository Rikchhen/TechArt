import { Request, Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import userRoutes from "./user.routes";
import orderRoutes from "./order.routes";
import uploadRoutes from "./upload.routes";
import eventsRoutes from "./events.routes";
import paymentRoutes from "./payment.routes";

const router = Router();

// Hands the SPA its CSRF token (the csrfProtection middleware has already set
// the matching cookie). Call once on load, then echo the value in x-csrf-token.
router.get("/csrf", (req: Request, res) => {
  res
    .status(200)
    .json({ csrfToken: (req as Request & { csrfToken?: string }).csrfToken });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/uploads", uploadRoutes);
router.use("/events", eventsRoutes);
router.use("/payments", paymentRoutes);

export default router;
