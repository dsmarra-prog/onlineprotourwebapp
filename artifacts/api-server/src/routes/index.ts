import { Router, type IRouter } from "express";
import healthRouter from "./health";
import careerRouter from "./career";
import tourRouter from "./tour";

const router: IRouter = Router();

router.use(healthRouter);
router.use(careerRouter);
router.use(tourRouter);

export default router;
