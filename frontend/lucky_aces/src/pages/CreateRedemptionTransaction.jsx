import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { redemptionTransaction } from '../APIRequest';
import "./TransactionFormPages.css";

function CreateRedemptionTransaction() {
  const [_loading, _setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState(0);
  const [remarkInput, setRemarkInput] = useState("");

  const [badRequest, _setBadRequest] = useState(false);
  const [success, _setSuccess] = useState(false);
  const [forbidden, _setForbidden] = useState(false);

  const { token, loading, setUpdate } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await redemptionTransaction(amountInput, remarkInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setSuccess(false);
        _setForbidden(false);
        break;
      case 403:
        _setBadRequest(false);
        _setForbidden(true);
        _setSuccess(false);
        break;
      case 201:
        _setBadRequest(false);
        _setSuccess(true);
        _setForbidden(false);
        setAmountInput(0);
        setRemarkInput("");
        setUpdate((prev) => !prev);
        break
    }
  }

  return (
    <div className="page-shell single-form-page" data-surface="flat">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Preparing the redemption console.</p>
        </div>
      ) : (
        <section className="transaction-form-card">
          <div>
            <p className="eyebrow">Wallet · Redemption</p>
            <h1 className="page-title">Create Redemption Transaction</h1>
            <p className="page-subtitle single-form-subtitle">Deduct points and capture the reason in one step.</p>
          </div>

          <div className="transaction-feedback">
            {success && <div className="success-message">Redemption transaction submitted successfully.</div>}
            {forbidden && <div className="error-message">You must be verified before completing redemptions.</div>}
          </div>

          <form className="transaction-form" onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="amountInput">Amount</label>
              <input
                id="amountInput"
                type="number"
                value={amountInput}
                min="1"
                step="1"
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />
              {badRequest && (
                <p className="field-error">Must be a positive integer within your available balance.</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="remarkInput">Remark</label>
              <input
                id="remarkInput"
                type="text"
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                placeholder="Optional context"
              />
              {badRequest && <p className="field-error">Share a short remark for this redemption.</p>}
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit">Redeem Points</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default CreateRedemptionTransaction;