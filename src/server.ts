
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import {
  connectStore,
  createCoupon,
  findCoupon,
  listCoupons
} from "./store";
import type { Coupon } from "./types";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Get all coupons
app.get(
  "/coupons",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const coupons = await listCoupons();
      res.json({ coupons });
    } catch (err) {
      next(err);
    }
  }
);

// Create a new coupon
app.post(
  "/coupons",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, discountPercent, expiresAt } = req.body ?? {};

      // Validate coupon code
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({
          error: "Coupon code is required"
        });
      }

      // Validate discount percentage
      if (
        typeof discountPercent !== "number" ||
        !Number.isFinite(discountPercent) ||
        !Number.isInteger(discountPercent) ||
        discountPercent < 1 ||
        discountPercent > 90
      ) {
        return res.status(400).json({
          error: "Discount percent must be between 1 and 90"
        });
      }

      // Validate expiry date
      if (
        typeof code !== "string" || !code.trim()) {
  return res.status(400).json({
    error: "Coupon code is required"
  });
}

const normalizedCode = code.trim().toUpperCase();

if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
  return res.status(400).json({
    error:
      "Coupon code must be 3–30 characters and contain only letters, numbers, hyphens, or underscores"
        });
      }

      ;

      // Expiry must be in the future
            // Validate expiry date
      if (
        typeof expiresAt !== "string" ||
        !expiresAt.trim() ||
        Number.isNaN(Date.parse(expiresAt))
      ) {
        return res.status(400).json({
          error: "A valid expiry date is required"
        });
      }

      const expiry = new Date(expiresAt);

      // Expiry must be in the future
      if (expiry.getTime() <= Date.now()) {
        return res.status(400).json({
          error: "Expiry date must be in the future"
        });
      }
      // Prepare coupon data
      const coupon: Coupon = {
        code: code.trim().toUpperCase(),
        discountPercent,
        expiresAt: expiry,
        createdAt: new Date()
      };

      // Save coupon to MongoDB
      const created = await createCoupon(coupon);

      return res.status(201).json({
        message: "Coupon created successfully",
        coupon: created
      });
    } catch (err: any) {
      // MongoDB duplicate-key error
      if (err?.code === 11000) {
        return res.status(409).json({
          error: "Coupon code already exists"
        });
      }

      return next(err);
    }
  }
);

// Apply a coupon to a purchase amount
app.post(
  "/coupons/apply",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, amount } = req.body ?? {};

      // Validate coupon code
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({
          error: "Coupon code is required"
        });
      }

      // Validate purchase amount
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount)
      ) {
        return res.status(400).json({
          error: "Amount must be a valid number"
        });
      }

      if (amount <= 0) {
  return res.status(400).json({
    error: "Amount must be greater than zero"
  });
}

if (amount > 10000000) {
  return res.status(400).json({
    error: "Amount cannot exceed ₹1 crore"
  });
}

      // Find coupon in the database
      const coupon = await findCoupon(code);

      if (!coupon) {
        return res.status(404).json({
          error: "Coupon code does not exist"
        });
      }

      // Reject expired coupons
      if (coupon.expiresAt.getTime() <= Date.now()) {
        return res.status(400).json({
          error: "Coupon has expired"
        });
      }

      // Calculate discount and final price
      const discountAmount = Number(
        ((amount * coupon.discountPercent) / 100).toFixed(2)
      );

      const finalAmount = Number(
        (amount - discountAmount).toFixed(2)
      );

      return res.json({
        message: "Coupon applied successfully",
        couponCode: coupon.code,
        discountPercent: coupon.discountPercent,
        originalAmount: amount,
        discountAmount,
        finalAmount
      });
    } catch (err) {
      return next(err);
    }
  }
);

// Handle invalid JSON requests
app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        error: "Invalid JSON request body"
      });
    }

    return next(err);
  }
);

// General error handler
app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      error: "Internal server error"
    });
  }
);

// Start the server after attempting MongoDB connection
const port = Number(process.env.PORT) || 3000;

connectStore(process.env.MONGODB_URI).finally(() => {
  app.listen(port, () => {
    console.log(`Coupon API running at http://localhost:${port}`);
  });
});
