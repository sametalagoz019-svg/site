import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const CommentSchema = new mongoose.Schema(
  {
    news: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["approved", "pending"],
      default: "approved",
      index: true
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

export default useLocalDb()
  ? createLocalModel("Comment")
  : mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
