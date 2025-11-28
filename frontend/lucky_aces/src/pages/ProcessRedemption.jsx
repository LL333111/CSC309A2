import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { processRedemption } from "../APIRequest";
import { useParams } from 'react-router-dom';
import "./TransactionFormPages.css";

function ProcessRedemption() {
  const { transactionId } = useParams();

  const [_loading, _setLoading] = useState(true);
  const [transactionIdInput, setTransactionIdInput] = useState(transactionId === undefined ? "" : transactionId);

  const [badRequest, _setBadRequest] = useState(false);
  const [noTransaction, _setNoTransaction] = useState(false);
  const [success, _setSuccess] = useState(false);
  const [transactionIdShow, _setTransactionIdShow] = useState("");

  const { loading, token } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await processRedemption(
      transactionIdInput,
      token
    );
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setNoTransaction(false);
        _setSuccess(false);
        break;
      case 404:
        _setBadRequest(false);
        _setNoTransaction(true);
        _setSuccess(false);
        break;
      case 200:
        _setTransactionIdShow(transactionIdInput);
        _setBadRequest(false);
        _setNoTransaction(false);
        _setSuccess(true);
        setTransactionIdInput("");
        break
    }
  }

  return (
    <div className="page-shell single-form-page" data-surface="flat">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Preparing the processing console.</p>
        </div>
      ) : (
        <section className="transaction-form-card">
          <div>
            <p className="eyebrow">Wallet · Processing</p>
            <h1 className="page-title">Process Redemption Transaction</h1>
            <p className="page-subtitle single-form-subtitle">Confirm redemptions from the queue and free up customer points.</p>
          </div>

          <div className="transaction-feedback">
            {success && (
              <div className="success-message">
                {`Redemption ${transactionIdShow} processed successfully.`}
              </div>
            )}
            {noTransaction && (
              <div className="error-message">No pending redemption matches that transaction ID.</div>
            )}
            {badRequest && (
              <div className="error-message">
                Provide an ID from the unprocessed list before submitting.
              </div>
            )}
          </div>

          <form className="transaction-form" onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="transactionIdInput">Transaction ID</label>
              <input
                id="transactionIdInput"
                type="number"
                value={transactionIdInput}
                onChange={(e) => setTransactionIdInput(e.target.value)}
                required
                min="1"
                step="1"
                placeholder="Enter pending redemption ID"
              />
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit">Process Redemption</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default ProcessRedemption;