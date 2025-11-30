import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetToken } from "../APIRequest";
import "./Register.css";

function ResetToken() {
  const navigate = useNavigate();
  const [utoridInput, setUtoridInput] = useState("");

  const [badRequest, setBadRequest] = useState(false);
  const [tooManyRequests, setTooManyRequests] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await resetToken(utoridInput);

    // 检查返回的是数字还是对象
    if (typeof response === 'number') {
      // 处理数字状态码
      switch (response) {
        case 400:
          setBadRequest(true);
          setTooManyRequests(false);
          setNotFound(false);
          setSuccess(false);
          break;
        case 429:
          setBadRequest(false);
          setTooManyRequests(true);
          setNotFound(false);
          setSuccess(false);
          break;
        case 404:
          setBadRequest(false);
          setTooManyRequests(false);
          setNotFound(true);
          setSuccess(false);
          break;
      }
    } else if (response && typeof response === 'object') {
      navigate(`/reset/${response.resetToken}`);
    }
  }

  return (
    <div className="register-card">
      <p className="eyebrow">Directory · Password Management</p>
      <h1 className="page-title">Reset Your Token</h1>
      <p className="register-subtitle">We will send you the request to reset your password!</p>

      {success && (
        <div className="success-message">
          Successfully reset token.
        </div>
      )}

      {notFound && <div className="error-message">No user found with that UTORID.</div>}
      {tooManyRequests && <div className="error-message">Too Many Requests from same IP.</div>}
      {badRequest && <div className="info-message">Double-check imput UTORID before submitting again.</div>}

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="utoridInput">UTORID</label>
          <input
            id="utoridInput"
            type="text"
            value={utoridInput}
            onChange={(e) => setUtoridInput(e.target.value)}
            placeholder="7-8 alphanumeric characters"
            required
          />
          {badRequest && <p className="field-error">Unique, alphanumeric, 7-8 characters.</p>}
        </div>

        <button type="submit" className="register-button">Reset Token</button>
      </form>
    </div>
  );
}

export default ResetToken;