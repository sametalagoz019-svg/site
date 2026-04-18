import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const VisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true
    },
    userAgent: {
      type: String,
      default: ""
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default useLocalDb()
  ? createLocalModel("Visitor")
  : mongoose.models.Visitor || mongoose.model("Visitor", VisitorSchema);
