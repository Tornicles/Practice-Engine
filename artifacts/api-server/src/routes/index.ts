import { Router, type IRouter } from "express";
import healthRouter from "./health.ts";
import meRouter from "./me.ts";
import strategyRouter from "./strategy.ts";
import objectivesRouter from "./objectives.ts";
import programsRouter from "./programs.ts";
import developmentRouter from "./development.ts";
import clientsRouter from "./clients.ts";
import expertiseRouter from "./expertise.ts";
import methodsRouter from "./methods.ts";
import conditionsRouter from "./conditions.ts";
import investigationsRouter from "./investigations.ts";
import workflowsRouter from "./workflows.ts";
import commercialRouter from "./commercial.ts";
import productsRouter from "./products.ts";
import practiceRouter from "./practice.ts";
import intelligenceRouter from "./intelligence.ts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(strategyRouter);
router.use(objectivesRouter);
router.use(programsRouter);
router.use(developmentRouter);
router.use(clientsRouter);
router.use(expertiseRouter);
router.use(methodsRouter);
router.use(conditionsRouter);
router.use(investigationsRouter);
router.use(workflowsRouter);
router.use(commercialRouter);
router.use(productsRouter);
router.use(practiceRouter);
router.use(intelligenceRouter);

export default router;
