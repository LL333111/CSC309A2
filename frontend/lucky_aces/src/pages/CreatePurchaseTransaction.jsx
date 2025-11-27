import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import { createPurchase } from '../APIRequest';
import { useParams } from 'react-router-dom';

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
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)}>
          <h1>Create Purchase Transaction</h1>
          {success && <h3>{`Successfully made a purchase transaction!`}</h3>}
          {noUser && <p>Sorry, You need to be verified before using this function.</p>}
          <div>
            <label htmlFor="utoridInput">UTORID: </label>
            <input
              id="utoridInput"
              type="text"
              value={utoridInput}
              onChange={(e) => setUtoridInput(e.target.value)}
              required
            />
            {badRequest && <p>Unique, Alphanumeric, 7-8 characters</p>}
          </div>
          <div>
            <label htmlFor="spentInput">Spent: </label>
            <input
              id="spentInput"
              type="number"
              value={spentInput}
              onChange={(e) => setSpentInput(e.target.value)}
              required
              min={0}
            />
            {badRequest && <p>Must be a positive numeric value.</p>}
          </div>
          <div>
            <label htmlFor="numbers">Promotion ID: </label>
            <input type="text" id="numbers" value={promotionIdsInput} onChange={(e) => setPromotionIdsInput(e.target.value)} placeholder="E.g. 1,2,3,4,5" />
            <div>Each ID is separated by a comma.</div>
            {badRequest && <p>Each promotion should be valid.</p>}
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
          <button type="submit">Create</button>
        </form>
      )}
    </div>
  )
}

export default CreatePurchaseTransaction;