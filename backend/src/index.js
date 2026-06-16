import express from "express";
import env from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./db/app.js";
import app from "./app.js";

env.config();
connectDb() //  returns Promise , so handling via then..catch
  .then(() => {
    app.on("Error", (error) => {
      console.log(`Error is: ${error}`);
      throw error;
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running at  http://localhost:${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.log(` MongoDb Connection Error ::`);
  });
