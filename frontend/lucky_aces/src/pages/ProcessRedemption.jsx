import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { processRedemption } from "../APIRequest";
import { useParams } from 'react-router-dom';

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
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)}>
          <h1>Process Redemption Transaction</h1>
          {success && <h3>{`Successfully process the redemption transaction with ID ${transactionIdShow}!`}</h3>}
          <div>
            <label htmlFor="transactionIdInput">Transaction ID: </label>
            <input
              id="transactionIdInput"
              type="number"
              value={transactionIdInput}
              onChange={(e) => setTransactionIdInput(e.target.value)}
              required
              min="1"
              step="1"
            />
            {badRequest && <p>Please ensure that the ID you entered corresponds to an unprocessed redemption transaction!</p>}
          </div>
          <button type="submit">Process</button>
        </form>
      )}
    </div>
  )
}

export default ProcessRedemption;