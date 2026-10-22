import express from "express";
import cors from "cors";
import helmet from "helmet";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      cb(
        null,
        !origin ||
          (process.env.CORS_ORIGIN || "http://localhost:5173")
            .split(",")
            .map((s) => s.trim())
            .includes(origin),
      ),
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use("/api", router);
app.use(errorHandler);
