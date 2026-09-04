import { Router, type IRouter } from "express";
import healthRouter from "./health.ts";
import practiceRouter from "./practice.ts";
import intelligenceRouter from "./intelligence.ts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(practiceRouter);
router.use(intelligenceRouter);

export default router;
