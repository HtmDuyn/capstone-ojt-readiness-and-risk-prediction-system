import { Router } from "express";

import authRoutes from "./modules/auth/auth.routes";
import systemRoutes from "./modules/system/system.routes";

const router = Router();

router.use(
  "/auth",
  authRoutes,
);

router.use(
  "/",
  systemRoutes,
);

export default router;