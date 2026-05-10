import express from "express";
import env from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

env.config({
    path: "./.env"
});

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser()); // for cookie related

app.get("/", (req, res) => {
  res.send("Hello World!");
});

import userRoute from './routes/user.route.js'
import messageRoute from './routes/message.route.js'

app.use('/api/v1/auth', userRoute)
app.use('/api/v1/message', messageRoute)

export default app;
