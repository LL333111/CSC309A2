import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { createRewardTransaction } from "../APIRequest";
import "./TransactionFormPages.css";

function RewardPoints() {
  const navigate = useNavigate();
  const [_loading, _setLoading] = useState(true);
  const [utoridInput, setUtoridInput] = useState("");
  const [amountInput, setAmountInput] = useState(1);
  const [remarkInput, setRemarkInput] = useState("");
  const { eventId } = useParams();

  const [badRequest, _setBadRequest] = useState(false);
  const [notFound, _setNotFound] = useState(false);
  const [forbidden, _setForbidden] = useState(false);
  const [success, _setSuccess] = useState(false);

  const { token, loading } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await createRewardTransaction(amountInput, utoridInput, remarkInput, token, eventId);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setNotFound(false);
        _setForbidden(false);
        _setSuccess(false);
        break;
      case 404:
        _setBadRequest(false);
        _setNotFound(true);
        _setForbidden(false);
        _setSuccess(false);
        break;
      case 403:
        _setBadRequest(false);
        _setNotFound(false);
        _setForbidden(true);
        _setSuccess(false);
        break;
      case 201:
        _setBadRequest(false);
        _setNotFound(false);
        _setForbidden(false);
        _setSuccess(true);
        setUtoridInput("");
        setAmountInput(1);
        setRemarkInput("");
        break
    }
  }

  return (
    <div className="page-shell single-form-page" data-surface="flat">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Preparing the reward console.</p>
        </div>
      ) : (
        <section className="transaction-form-card">
          <div>
            <p className="eyebrow">Events · Rewards</p>
            <h1 className="page-title">Reward Points</h1>
            <p className="page-subtitle single-form-subtitle">Grant points directly to attendees of this event.</p>
          </div>

          <div className="transaction-feedback">
            {success && <div className="success-message">Successfully rewarded points.</div>}
            {forbidden && (
              <div className="error-message">
                Only a manager, higher authority, or the event organizer can reward points.
              </div>
            )}
            {notFound && <div className="error-message">No user exists with the provided UTORid.</div>}
            {badRequest && (
              <div className="error-message">Review the UTORid, available points, and remark before submitting.</div>
            )}
          </div>

          <form className="transaction-form" onSubmit={(e) => handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="utoridInput">UTORid</label>
              <input
                id="utoridInput"
                type="text"
                value={utoridInput}
                onChange={(e) => setUtoridInput(e.target.value)}
                placeholder="Enter attendee UTORid"
              />
              {badRequest && (
                <p className="field-error">UTORid must be alphanumeric, 7-8 characters, and part of this event.</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="amountInput">Amount</label>
              <input
                id="amountInput"
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
                min={1}
                step={1}
              />
              {badRequest && (
                <p className="field-error">Must be a positive integer within the event&apos;s remaining balance.</p>
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
              {badRequest && <p className="field-error">Add a short note describing this reward.</p>}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Back
              </button>
              <button className="btn-primary" type="submit">Reward Points</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

export default RewardPoints;