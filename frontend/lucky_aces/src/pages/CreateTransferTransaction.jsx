import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { transferTransaction } from '../APIRequest';
import { useParams } from 'react-router-dom';
import "./TransactionFormPages.css";

function CreateTransferTransaction() {
  const { utorid } = useParams();

  const [_loading, _setLoading] = useState(true);
  const [recipientIDInput, setRecipientIDInput] = useState(utorid === undefined ? "" : utorid);
  const [amountInput, setAmountInput] = useState(0);
  const [remarkInput, setRemarkInput] = useState("");

  const [utoridShow, _setUtoridShow] = useState("");
  const [badRequest, _setBadRequest] = useState(false);
  const [noUser, _setNoUser] = useState(false);
  const [forbidden, _setForbidden] = useState(false);
  const [success, _setSuccess] = useState(false);

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

    const response = await transferTransaction(recipientIDInput, amountInput, remarkInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setNoUser(false);
        _setForbidden(false);
        _setSuccess(false);
        break;
      case 404:
        _setBadRequest(false);
        _setNoUser(true);
        _setForbidden(false);
        _setSuccess(false);
        break;
      case 403:
        _setBadRequest(false);
        _setNoUser(false);
        _setForbidden(true);
        _setSuccess(false);
        break;
      case 201:
        _setUtoridShow(recipientIDInput);
        _setBadRequest(false);
        _setNoUser(false);
        _setForbidden(false);
        _setSuccess(true);
        setRecipientIDInput("");
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
          <p>Preparing your transfer workspace.</p>
        </div>
      ) : (
        <section className="transaction-form-card">
          <div>
            <p className="eyebrow">Wallet · Transfer</p>
            <h1 className="page-title">Create Transfer Transaction</h1>
            <p className="page-subtitle single-form-subtitle">Send points securely between members.</p>
          </div>

          <div className="transaction-feedback">
            {success && (
              <div className="success-message">
                {`Successfully transferred points to ${utoridShow}.`}
              </div>
            )}
            {forbidden && (
              <div className="error-message">You must be verified before sending transfers.</div>
            )}
            {noUser && (
              <div className="error-message">No user exists with the provided UTORid.</div>
            )}
          </div>

          <form className="transaction-form" onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="recipientIDInput">Recipient ID</label>
              <input
                id="recipientIDInput"
                type="text"
                value={recipientIDInput}
                onChange={(e) => setRecipientIDInput(e.target.value)}
                placeholder="Enter UTORid"
                required
              />
              {badRequest && <p className="field-error">Please provide a valid recipient UTORid.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="amountInput">Amount</label>
              <input
                id="amountInput"
                type="number"
                min="1"
                step="1"
                value={amountInput}
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
              {badRequest && <p className="field-error">Share any short remark about this transfer.</p>}
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit">Transfer Points</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default CreateTransferTransaction;