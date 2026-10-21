import mongoose, { Schema, Model } from "mongoose";
import type { Coupon } from "./types";

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CouponModel: Model<any> =
  (mongoose.models.Coupon as Model<any>) || mongoose.model("Coupon", couponSchema);

const memoryCoupons = new Map<string, Coupon>();
let useMongo = false;

export async function connectStore(uri?: string): Promise<void> {
  if (!uri) {
    console.log("MONGODB_URI not set: using in-memory coupon storage.");
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    useMongo = true;
    console.log("Connected to MongoDB.");
  } catch (error) {
    console.warn("MongoDB connection failed; using in-memory storage.", error instanceof Error ? error.message : "");
  }
}

export async function listCoupons(): Promise<Coupon[]> {
  if (useMongo) {
    const docs = await CouponModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      code: d.code,
      discountPercent: d.discountPercent,
      expiresAt: new Date(d.expiresAt),
      createdAt: new Date(d.createdAt)
    }));
  }
  return [...memoryCoupons.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function findCoupon(code: string): Promise<Coupon | undefined> {
  const normalized = code.trim().toUpperCase();
  if (useMongo) {
    const d = await CouponModel.findOne({ code: normalized }).lean() as any;
    if (!d) return undefined;
    return {
      code: d.code,
      discountPercent: d.discountPercent,
      expiresAt: new Date(d.expiresAt),
      createdAt: new Date(d.createdAt)
    };
  }
  return memoryCoupons.get(normalized);
}

export async function createCoupon(coupon: Coupon): Promise<Coupon> {
  const normalized = { ...coupon, code: coupon.code.trim().toUpperCase() };
  if (useMongo) {
    const created = await CouponModel.create(normalized);
    return {
      code: created.code,
      discountPercent: created.discountPercent,
      expiresAt: new Date(created.expiresAt),
      createdAt: new Date(created.createdAt)
    };
  }
  if (memoryCoupons.has(normalized.code)) {
    const error = new Error("Coupon code already exists") as Error & { code?: number };
    error.code = 11000;
    throw error;
  }
  memoryCoupons.set(normalized.code, normalized);
  return normalized;
}