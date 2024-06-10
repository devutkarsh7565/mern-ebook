import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("connected to mongodb successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("connection error", err);
    });
    await mongoose.connect(config.databaseUrl as string);
  } catch (err) {
    console.error("failed to connect to mongodb", err);
    process.exit(1);
  }
};

export default connectDB;
