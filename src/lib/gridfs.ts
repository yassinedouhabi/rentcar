import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";

export function getGridFSBucket(): GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected");
  return new GridFSBucket(db, { bucketName: "documents" });
}
