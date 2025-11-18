import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { redemptionTransaction } from '../APIRequest';

function CreateRedemptionTransaction() {
  const [_loading, _setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState(0);
  const [remarkInput, setRemarkInput] = useState("");

  const [badRequest, _setBadRequest] = useState(false);
  const [success, _setSuccess] = useState(false);
  const [forbidden, _setForbidden] = useState(false);

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
          <h1>Create Redemption Transaction</h1>
          {success && <h3>{`Successfully made a redemption transaction!`}</h3>}
          {forbidden && <p>Sorry, You need to be verified before using this function.</p>}
          <div>
            <label htmlFor="amountInput">Amount: </label>
            <input
              id="amountInput"
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />
            {badRequest && <p>Must be a positive integer value, and less than the number of points you have.</p>}
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
          <button type="submit">Redeem</button>
        </form>
      )}
    </div>
  )
}

export default CreateRedemptionTransaction;