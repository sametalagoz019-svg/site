import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const AdminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.AdminUser ||
  (useLocalDb() ? createLocalModel("AdminUser") : mongoose.model("AdminUser", AdminUserSchema));
