import mongoose from "mongoose";
import env from "dotenv"

const DB_name = process.env.DB_NAME

export const connectDb = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`)
        console.log("MongoDb Connected Successfully at : ", conn.connection.host)
    } catch (error) {
        console.log("MongoDb Connection error: ", error)
    }
}