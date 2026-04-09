import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: ""
    },
    contentImages: {
      type: [String],
      default: []
    },
    videoUrl: {
      type: String,
      default: ""
    },
    sourceName: {
      type: String,
      default: ""
    },
    sourceUrl: {
      type: String,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published"],
      default: "draft",
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isAutomated: {
      type: Boolean,
      default: false
    },
    automatedSourceSummary: {
      type: String,
      default: ""
    },
    viewCount: {
      type: Number,
      default: 0
    },
    sortOrder: {
      type: Number,
      default: 9999
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default useLocalDb()
  ? createLocalModel("News")
  : mongoose.models.News || mongoose.model("News", NewsSchema);
