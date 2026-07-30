import { Router } from "express";
import { eventsController } from "../controllers/events.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

// Admin-only live stream powering the dashboard.
router.get("/", requireAuth, requireRole("admin"), eventsController.stream);

export default router;
