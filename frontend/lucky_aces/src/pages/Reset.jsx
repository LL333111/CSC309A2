import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../APIRequest";
import "./Register.css";

function Reset() {
  const navigate = useNavigate();
  const { resetToken } = useParams();

  const [utoridInput, setUtoridInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [badRequest, setBadRequest] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [gone, setGone] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await resetPassword(utoridInput, passwordInput, resetToken);

    switch (response) {
      case 400:
        setBadRequest(true);
        setUnauthorized(false);
        setNotFound(false);
        setGone(false);
        setSuccess(false);
        break;
      case 401:
        setBadRequest(false);
        setUnauthorized(true);
        setNotFound(false);
        setGone(false);
        setSuccess(false);
        break;
      case 404:
        setBadRequest(false);
        setUnauthorized(false);
        setNotFound(true);
        setGone(false);
        setSuccess(false);
        break;
      case 410:
        setBadRequest(false);
        setUnauthorized(false);
        setNotFound(false);
        setGone(true);
        setSuccess(false);
        break;
      case 200:
        navigate("/login");
        break;
    }
  }

  return (
    <div className="register-card">
      <p className="eyebrow">Directory · Password Management</p>
      <h1 className="page-title">Reset Your Password</h1>
      <p className="register-subtitle">Enter your UTORID and new password to reset your password.</p>

      {success && (
        <div className="success-message">
          Successfully reset password.
        </div>
      )}

      {notFound && <div className="error-message">No token found with that resetToken.</div>}
      {unauthorized && <div className="error-message">Token does not math that UTORID.</div>}
      {gone && <div className="error-message">Token expired.</div>}
      {badRequest && <div className="info-message">Double-check input UTORID and password before submitting again.</div>}

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

        <div className="form-group">
          <label htmlFor="passwordInput">New Password</label>
          <input
            id="passwordInput"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter your new password"
            required
          />
          {badRequest && <p className="field-error">8-20 characters with uppercase, lowercase, number, and symbol.</p>}
        </div>

        <button type="submit" className="register-button">Reset Password</button>
      </form>
    </div>
  );
}

export default Reset;