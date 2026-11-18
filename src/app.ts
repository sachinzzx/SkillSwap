import express, { NextFunction, Request, Response } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} ${new Date().toISOString()}`);
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "SkillSwap API running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
