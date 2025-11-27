import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { transferTransaction } from '../APIRequest';
import { useParams } from 'react-router-dom';

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
          <h1>Create Transfer Transaction</h1>
          {success && <h3>{`Successfully made a transfer transaction to ${utoridShow}!`}</h3>}
          {forbidden && <p>Sorry, You need to be verified before using this function.</p>}
          <div>
            <label htmlFor="recipientIDInput">Recipient ID: </label>
            <input
              id="recipientIDInput"
              type="text"
              value={recipientIDInput}
              onChange={(e) => setRecipientIDInput(e.target.value)}
              required
            />
            {badRequest && <p>The ID of the recipient</p>}
            {noUser && <p>No user with given ID</p>}
          </div>
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
          <button type="submit">Transfer</button>
        </form>
      )}
    </div>
  )
}

export default CreateTransferTransaction;