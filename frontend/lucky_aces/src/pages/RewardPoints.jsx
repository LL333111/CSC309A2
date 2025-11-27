import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { createRewardTransaction } from "../APIRequest";

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
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)}>
          <h1>Reward Points</h1>
          {success && <h3>{`Successfully reward points`}</h3>}
          {forbidden && <h3>{`Only a manager, higher authority, or the event organizer can reward points.`}</h3>}
          <div>
            <label htmlFor="utoridInput">UTORID: </label>
            <input
              id="utoridInput"
              type="text"
              value={utoridInput}
              onChange={(e) => setUtoridInput(e.target.value)}
            />
            {badRequest && <p>Unique, Alphanumeric, 7-8 characters</p>}
            {badRequest && <p>Please confirm that the user with this utorid is a guest of this event.</p>}
            {notFound && <p>User with that UTORID not exists</p>}
          </div>
          <div>
            <label htmlFor="amountInput">Amount: </label>
            <input
              id="amountInput"
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              min={1}
              step={1}
            />
            {badRequest && <p>Must be a positive integer value.</p>}
            {badRequest && <p>Please confirm that the event has sufficient points.</p>}
          </div>
          <div>
            <label htmlFor="remarkInput">Remark: </label>
            <input
              id="remarkInput"
              type="text"
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
            />
            {badRequest && <p>Any remark regarding this transaction</p>}
          </div>
          <button type="submit">Reward</button>
        </form>
      )
      }
    </div >
  )
}

export default RewardPoints;