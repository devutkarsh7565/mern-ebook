import express from "express";
import createHttpError from "http-errors";

import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();

app.get("/", (req, res, next) => {
  const error = createHttpError(400, "something went wrong");
  throw error;
  res.json({ message: "welcome to the basic of api" });
});

app.use("/api/users", userRouter);

// Global error handler

app.use(globalErrorHandler);

export default app;
