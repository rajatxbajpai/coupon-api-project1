# Part 2 — Find the Bugs

The `/apply` route has several problems:

1. **It does not check whether the coupon exists.** `Coupon.findOne()` returns `null` when no coupon matches. Accessing `coupon.expiresAt` then throws an error. Check `if (!coupon)` and return a `404 Not Found` response.

2. **It does not handle database or unexpected errors.** The database query can fail. Wrap the route logic in `try/catch`, log the error on the server, and return a generic `500 Internal Server Error` response.

3. **It does not validate the coupon code.** `req.body.code` may be missing, empty, or not a string. Validate it before querying the database, and trim whitespace.

4. **It does not validate the order amount.** `req.body.amount` may be missing, negative, non-numeric, or `NaN`. Require a finite number that is at least zero (and apply any business-specific minimum order amount).

5. **It does not validate the discount value.** A missing, non-numeric, negative, or greater-than-100 discount can produce an invalid result. Validate that the discount is a finite number between 0 and 100, unless the business rules explicitly allow a different range.

6. **It does not validate the expiry date.** If `expiresAt` is missing or invalid, the date comparison may not reject the coupon. Validate that the expiry timestamp is valid before comparing it.

7. **The expiry boundary is ambiguous.** The condition `coupon.expiresAt < new Date()` does not reject a coupon whose expiry time equals the current time. If coupons become invalid at the expiry instant, use `<=`.

8. **It does not round the monetary result.** JavaScript floating-point arithmetic can produce values with unexpected decimal precision. Use integer minor units (such as paise) or a decimal arithmetic library; for a simple two-decimal result, rounding can be applied after calculation.

9. **It does not check other coupon rules.** Depending on the requirements, the route should verify that the coupon is active and meets minimum-order, usage-limit, customer, or other eligibility rules. Only enforce rules that are part of the application's specification.

10. **It may use the wrong model field name.** The route uses `coupon.discount`; if the schema stores the field as `discountPercent`, this will be `undefined` and the calculation will be wrong. Use the actual schema field consistently.

11. **It relies on the request body being parsed.** The application must register `app.use(express.json())` before the route to parse JSON requests; otherwise `req.body` may be undefined.

12. **It should validate data at the schema/API boundary too.** Add appropriate Mongoose schema validation and ensure the route returns clear client errors for invalid input rather than relying only on database contents.

## Example corrected route

This example assumes the schema uses `code`, `expiresAt`, and `discount`. If the model uses `discountPercent`, replace `coupon.discount` accordingly.

```js
app.post("/apply", async (req, res) => {
  try {
    const { code, amount } = req.body ?? {};

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        message: "Valid coupon code is required",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        message: "Invalid order amount",
      });
    }

    const coupon = await Coupon.findOne({ code: code.trim() });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const discount = coupon.discount;

    if (
      typeof discount !== "number" ||
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      return res.status(500).json({
        message: "Invalid coupon configuration",
      });
    }

    const expiry = new Date(coupon.expiresAt);

    if (Number.isNaN(expiry.getTime())) {
      return res.status(500).json({
        message: "Invalid coupon expiry configuration",
      });
    }

    if (expiry <= new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    const finalAmount =
      Math.round(amount * (1 - discount / 100) * 100) / 100;

    return res.json({ finalAmount });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
```

Ensure JSON parsing middleware is registered before the route:

```js
app.use(express.json());
```

**Note:** The original percentage-discount formula is mathematically correct when the input amount and discount are valid. The main problems are missing-coupon handling, validation, error handling, and enforcement of applicable business rules.
