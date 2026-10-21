
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://coupon-api-project1-rf79.vercel.app'
type Coupon = {
  code: string
  discountPercent: number
  expiresAt: string
}

type ApplyResult = {
  originalAmount: number
  discountPercent?: number
  discountAmount: number
  finalAmount: number
}

function App() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState('10')
  const [expiresAt, setExpiresAt] = useState('2027-12-31')
  const [amount, setAmount] = useState('1000')
  const [applyCode, setApplyCode] = useState('SAVE10')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<ApplyResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadCoupons() {
    try {
      const response = await fetch(`${API_URL}/coupons`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not load coupons')
      }

      setCoupons(Array.isArray(data) ? data : data.coupons || [])
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not connect to the API on port 3000.'
      )
    }
  }

  useEffect(() => {
    void loadCoupons()
  }, [])

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedCode = code.trim().toUpperCase()
    const discount = Number(discountPercent)

    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizedCode)) {
      setMessage('Use 3–30 letters, numbers, hyphens, or underscores for the code.')
      return
    }

    if (!Number.isInteger(discount) || discount < 1 || discount > 90) {
      setMessage('Discount must be a whole number between 1 and 90.')
      return
    }

    setLoading(true)
    setMessage('')
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalizedCode,
          discountPercent: discount,
          expiresAt: new Date(`${expiresAt}T23:59:59.000Z`).toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create coupon')
      }

      setMessage(`Coupon ${normalizedCode} created successfully!`)
      setCode('')
      await loadCoupons()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const orderAmount = Number(amount)

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      setMessage('Enter an order amount greater than zero.')
      return
    }

    setLoading(true)
    setMessage('')
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: applyCode.trim().toUpperCase(),
          amount: orderAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not apply coupon')
      }

      setResult(data)
      setMessage(`Coupon ${applyCode.trim().toUpperCase()} applied successfully!`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const activeCoupons = coupons.filter(
    (coupon) => new Date(coupon.expiresAt).getTime() > Date.now()
  )

  const topDiscount = coupons.reduce(
    (highest, coupon) => Math.max(highest, coupon.discountPercent),
    0
  )

  const money = (value: number) =>
    `₹${Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">%</span>
          <span>Perkly<span className="brand-dot">.</span></span>
        </a>

        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav">
          <a className="nav-link selected" href="#overview">
            <span className="nav-icon">▦</span> Overview
          </a>
          <a className="nav-link" href="#coupons">
            <span className="nav-icon">◇</span> My coupons
          </a>
          <a className="nav-link" href="#calculator">
            <span className="nav-icon">⌗</span> Price calculator
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip-icon">✦</div>
          <h3>Smart savings</h3>
          <p>Create a coupon, apply it to an order, and see exactly how much you save.</p>
          <span className="sidebar-version">COUPON API · V1.0</span>
        </div>
      </aside>

      <div className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="breadcrumb">WORKSPACE <span>/</span> OVERVIEW</p>
            <h1>Good deals start here.</h1>
            <p className="page-subtitle">Manage your discounts, all in one place.</p>
          </div>
          <a className="primary-link" href="#create-coupon">
            <span>＋</span> New coupon
          </a>
        </header>

        {message && (
          <div
            className={`message ${message.toLowerCase().includes('successfully') ? 'success-message' : ''}`}
            role="status"
          >
            <span>{message.toLowerCase().includes('successfully') ? '✓' : 'ⓘ'}</span>
            {message}
            <button
              className="message-close"
              onClick={() => setMessage('')}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats-grid" aria-label="Coupon statistics">
          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon violet">◇</span>
              <span className="stat-caption">ALL TIME</span>
            </div>
            <p className="stat-label">Total coupons</p>
            <div className="stat-value">{coupons.length.toString().padStart(2, '0')}</div>
            <p className="stat-note">Coupons in your collection</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon green">✓</span>
              <span className="stat-caption">UP TO DATE</span>
            </div>
            <p className="stat-label">Active coupons</p>
            <div className="stat-value">{activeCoupons.length.toString().padStart(2, '0')}</div>
            <p className="stat-note">Not yet expired</p>
          </article>

          <article className="stat-card highlight-stat">
            <div className="stat-top">
              <span className="stat-icon amber">%</span>
              <span className="stat-caption">BEST DEAL</span>
            </div>
            <p className="stat-label">Highest discount</p>
            <div className="stat-value">{topDiscount}<span>%</span></div>
            <p className="stat-note">Maximum available savings</p>
          </article>
        </section>

        <section className="workspace-grid">
          <article className="panel" id="create-coupon">
            <div className="panel-heading">
              <div className="panel-heading-icon violet">✦</div>
              <div>
                <h2>Create a coupon</h2>
                <p>Set up a new offer for your customers.</p>
              </div>
            </div>

            <form onSubmit={createCoupon} className="app-form">
              <label htmlFor="code">Coupon code</label>
              <input
                id="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. SUMMER20"
                autoComplete="off"
                maxLength={30}
                required
              />
              <p className="field-hint">Letters, numbers, hyphens, and underscores</p>

              <div className="form-two-columns">
                <div>
                  <label htmlFor="discount">Discount (%)</label>
                  <div className="input-suffix">
                    <input
                      id="discount"
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      value={discountPercent}
                      onChange={(event) => setDiscountPercent(event.target.value)}
                      required
                    />
                    <span>%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="expiry">Expiry date</label>
                  <input
                    id="expiry"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="coupon-preview">
                <span className="preview-ticket">%</span>
                <div>
                  <strong>{code.trim().toUpperCase() || 'YOUR COUPON'}</strong>
                  <span>Discount code preview</span>
                </div>
                <b>{discountPercent || '0'}% OFF</b>
              </div>

              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? 'Creating coupon…' : '＋  Create coupon'}
              </button>
            </form>
          </article>

          <article className="panel calculator-panel" id="calculator">
            <div className="panel-heading">
              <div className="panel-heading-icon green">⌗</div>
              <div>
                <h2>Price calculator</h2>
                <p>See your savings before checkout.</p>
              </div>
            </div>

            <form onSubmit={applyCoupon} className="app-form">
              <label htmlFor="applyCode">Coupon code</label>
              <input
                id="applyCode"
                value={applyCode}
                onChange={(event) => setApplyCode(event.target.value)}
                placeholder="Enter your coupon code"
                autoComplete="off"
                required
              />

              <label htmlFor="amount">Order total</label>
              <div className="amount-input">
                <span>₹</span>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  max="10000000"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>

              <button className="submit-button green-button" type="submit" disabled={loading}>
                {loading ? 'Calculating…' : 'Apply coupon  →'}
              </button>
            </form>

            <div className={`checkout-summary ${result ? 'has-result' : ''}`}>
              <div className="summary-heading">
                <span>ORDER SUMMARY</span>
                {result && <span className="applied-badge">✓ APPLIED</span>}
              </div>
              <div className="summary-row">
                <span>Original price</span>
                <strong>{result ? money(result.originalAmount) : money(Number(amount) || 0)}</strong>
              </div>
              <div className="summary-row savings-row">
                <span>
                  Discount{result?.discountPercent ? ` (${result.discountPercent}%)` : ''}
                </span>
                <strong>
                  −{result ? money(result.discountAmount) : money(0)}
                </strong>
              </div>
              <div className="summary-divider" />
              <div className="final-price">
                <span>You pay</span>
                <strong>{result ? money(result.finalAmount) : money(Number(amount) || 0)}</strong>
              </div>
              {result && (
                <p className="savings-note">
                  ✦ You saved {money(result.discountAmount)} on this order!
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="panel coupons-panel" id="coupons">
          <div className="list-heading">
            <div>
              <div className="section-kicker">YOUR COLLECTION</div>
              <h2>Your coupons</h2>
              <p>All the discounts you've created, in one place.</p>
            </div>
            <button className="outline-button" type="button" onClick={() => void loadCoupons()}>
              ↻ Refresh list
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◇</div>
              <h3>No coupons yet</h3>
              <p>Create your first coupon and it will appear here.</p>
              <a href="#create-coupon">Create your first coupon →</a>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>COUPON</th>
                    <th>DISCOUNT</th>
                    <th>EXPIRY DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const isActive = new Date(coupon.expiresAt).getTime() > Date.now()

                    return (
                      <tr key={coupon.code}>
                        <td>
                          <div className="table-coupon">
                            <span className="table-ticket">%</span>
                            <div>
                              <strong>{coupon.code}</strong>
                              <span>Discount coupon</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="discount-pill">{coupon.discountPercent}% OFF</span>
                        </td>
                        <td>{new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`status-pill ${isActive ? 'status-active' : 'status-expired'}`}>
                            <span className="status-dot" />
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer">
            <span>Showing <strong>{coupons.length}</strong> coupon{coupons.length === 1 ? '' : 's'}</span>
            <span>Synced with your API <span className="online-dot" /></span>
          </div>
        </section>

        <footer className="app-footer">
          <span><span className="footer-brand">Perkly.</span> Coupon management made simple.</span>
          <span>React · TypeScript · Express · MongoDB</span>
        </footer>
      </div>
    </main>
  )
}

export default App
