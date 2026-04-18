import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const ArticleViewSchema = new mongoose.Schema(
  {
    news: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true
    },
    visitorId: {
      type: String,
      default: "anonymous"
    },
    userAgent: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: {
      createdAt: "viewedAt",
      updatedAt: false
    }
  }
);

export default mongoose.models.ArticleView ||
  (useLocalDb()
    ? createLocalModel("ArticleView")
    : mongoose.model("ArticleView", ArticleViewSchema));
