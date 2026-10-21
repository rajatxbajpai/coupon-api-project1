# Coupon API (Node.js + Express + TypeScript)

Create coupons, list them, and apply percentage discounts to order amounts. Uses MongoDB when `MONGODB_URI` is configured and reachable; otherwise falls back to in-memory storage (data is lost when the process stops).

## Requirements
- Node.js 18+
- npm
- Optional: MongoDB local instance or MongoDB Atlas connection string

## Run locally
```bash
npm install
cp .env.example .env
# Optional: edit .env and set MONGODB_URI
npm run dev
```
API starts at `http://localhost:3000`.

For an in-memory run, remove/comment out `MONGODB_URI` in `.env`. If MongoDB is configured but unreachable, the app logs a warning and falls back to memory.

## Endpoints

### `POST /coupons`
```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "expiresAt": "2027-12-31T23:59:59.000Z"
}
```
Returns `201 Created`. Duplicate codes return `409`.

### `GET /coupons`
Returns `{ "coupons": [...] }`.

### `POST /coupons/apply`
```json
{ "code": "SAVE10", "amount": 250 }
```
Example response:
```json
{
  "message": "Coupon applied successfully",
  "couponCode": "SAVE10",
  "discountPercent": 10,
  "originalAmount": 250,
  "discountAmount": 25,
  "finalAmount": 225
}
```

Errors:
- `400` — missing amount, non-numeric amount, negative amount, missing coupon code, or expired coupon
- `404` — coupon code does not exist
- `409` — duplicate coupon code
- `500` — unexpected server error

## Test with curl
Create a coupon:
```bash
curl -X POST http://localhost:3000/coupons \
  -H 'Content-Type: application/json' \
  -d '{"code":"SAVE10","discountPercent":10,"expiresAt":"2027-12-31T23:59:59.000Z"}'
```
Apply it:
```bash
curl -X POST http://localhost:3000/coupons/apply \
  -H 'Content-Type: application/json' \
  -d '{"code":"SAVE10","amount":250}'
```
List coupons:
```bash
curl http://localhost:3000/coupons
```

## Notes
- Coupon codes are case-insensitive and stored in uppercase.
- Amount must be a JSON number, e.g. `250`, not a string such as `"250"`.
- The API validates the amount before looking up the coupon.
- In-memory storage is intended for local development and demonstrations.
