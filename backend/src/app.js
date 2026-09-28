import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { sendError, ERROR_CODES } from "./utils/apiResponse.js";

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
        callback(new Error("CORS_POLICY_VIOLATION"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Memora AI Backend API");
});

import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";

app.use("/api/v1/auth", userRoute);
app.use("/api/v1/message", messageRoute);

// 404 handler for unmatched API routes
app.use((req, res) => {
  sendError(res, {
    statusCode: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "The requested resource could not be found.",
    req,
  });
});

// Global unhandled error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.message === "CORS_POLICY_VIOLATION") {
    return sendError(res, {
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: "Access forbidden by security policy.",
      error: err,
      req,
    });
  }

  sendError(res, {
    statusCode: err.status || err.statusCode || 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "Something went wrong on our side. Please try again.",
    error: err,
    req,
  });
});

export default app;
