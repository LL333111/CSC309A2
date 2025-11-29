import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { createPurchase } from '../APIRequest';
import { useParams } from 'react-router-dom';
import "./TransactionFormPages.css";

function CreatePurchaseTransaction() {
  const { utorid } = useParams();

  const [_loading, _setLoading] = useState(true);
  const [utoridInput, setUtoridInput] = useState(utorid === undefined ? "" : utorid);
  const [spentInput, setSpentInput] = useState("");
  const [promotionIdsInput, setPromotionIdsInput] = useState("");
  const [remarkInput, setRemarkInput] = useState("");

  const [badRequest, _setBadRequest] = useState(false);
  const [success, _setSuccess] = useState(false);
  const [noUser, _setNoUser] = useState(false);

  const { token, loading } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let promotionId = promotionIdsInput
      .split(',')
      .map(num => num.trim())
      .filter(num => num !== '')
      .map(num => parseInt(num, 10));
    const response = await createPurchase(utoridInput, Number(spentInput), promotionId, remarkInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setSuccess(false);
        _setNoUser(false);
        break;
      case 404:
        _setBadRequest(false);
        _setNoUser(true);
        _setSuccess(false);
        break;
      case 201:
        _setBadRequest(false);
        _setSuccess(true);
        _setNoUser(false);
        setUtoridInput("");
        setSpentInput("");
        setPromotionIdsInput("");
        setRemarkInput("");
        break
    }
  }

  return (
    <div className="page-shell single-form-page" data-surface="flat">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Setting up your purchase workspace.</p>
        </div>
      ) : (
        <section className="transaction-form-card">
          <div>
            <p className="eyebrow">Wallet · Purchase</p>
            <h1 className="page-title">Create Purchase Transaction</h1>
            <p className="page-subtitle single-form-subtitle">Record member spend and reward them instantly.</p>
          </div>

          <div className="transaction-feedback">
            {success && <div className="success-message">Purchase transaction submitted successfully.</div>}
            {noUser && <div className="error-message">No member matches that UTORid.</div>}
          </div>

          <form className="transaction-form" onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="utoridInput">UTORid</label>
              <input
                id="utoridInput"
                type="text"
                value={utoridInput}
                onChange={(e) => setUtoridInput(e.target.value)}
                placeholder="Enter UTORid"
                required
              />
              {badRequest && <p className="field-error">Must be alphanumeric and 7-8 characters.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="spentInput">Amount Spent</label>
              <input
                id="spentInput"
                type="number"
                min="0"
                step="0.01"
                value={spentInput}
                onChange={(e) => setSpentInput(e.target.value)}
                required
              />
              {badRequest && <p className="field-error">Enter a positive numeric value.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="promotionIds">Promotion IDs</label>
              <input
                id="promotionIds"
                type="text"
                value={promotionIdsInput}
                onChange={(e) => setPromotionIdsInput(e.target.value)}
                placeholder="e.g., 1,2,5"
              />
              <small>Separate IDs with commas.</small>
              {badRequest && <p className="field-error">Ensure each promotion ID is valid.</p>}
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
              {badRequest && <p className="field-error">Add any helpful notes for the ledger.</p>}
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit">Create Purchase</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default CreatePurchaseTransaction;