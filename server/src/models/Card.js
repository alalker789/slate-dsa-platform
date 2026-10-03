import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  cat: { type: String, required: true, index: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  order: { type: Number, default: 0 },
});

export const Card = mongoose.model("Card", cardSchema);
