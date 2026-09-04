import { Router, type IRouter } from "express";
import healthRouter from "./health";
import practiceRouter from "./practice";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(practiceRouter);
router.use(intelligenceRouter);

export default router;
