import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

env.config({
  path: "./.env",
});

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      if (!incomingOrigin || allowedOrigins.includes(incomingOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser()); // for cookie related

app.get("/", (req, res) => {
  res.send("Hello World!");
});

import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";

app.use("/api/v1/auth", userRoute);
app.use("/api/v1/message", messageRoute);

export default app;
