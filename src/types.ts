export interface Coupon {
  code: string;
  discountPercent: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateCouponInput {
  code: string;
  discountPercent: number;
  expiresAt: Date;
}