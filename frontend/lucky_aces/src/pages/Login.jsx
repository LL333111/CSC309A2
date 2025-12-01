import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as APIlogin } from "../APIRequest";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import "./Login.css";

function Login() {
  const [utoridInput, setUtoridInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const navigate = useNavigate();
  const { login } = useLoggedInUser();

  const [badRequest, _setBadRequest] = useState(false);
  const [noUser, _setNoUser] = useState(false);
  const [incorretPassword, _setIncorretPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await APIlogin(utoridInput, passwordInput);
    if (!response) {
      // Network/server error already surfaced by API helper
      return;
    }

    if (typeof (response) === "number") {
      switch (response) {
        case 400:
          _setBadRequest(true);
          _setIncorretPassword(false);
          _setNoUser(false);
          break;
        case 404:
          _setNoUser(true);
          _setIncorretPassword(false);
          _setBadRequest(false);
          break;
        case 401:
          _setIncorretPassword(true);
          _setNoUser(false);
          _setBadRequest(false);
          break
      }
      return;
    }

    login(response.token, response.expiresAt);
    navigate("/profile");
  }

  return (
    <div className="login-container" data-surface="flat">
      <div className="login-card">
        <h1>Sign in to Lucky Aces</h1>
        <p className="login-subtitle">Secure, role-aware access for every permission tier.</p>

        <form className="login-form" onSubmit={(e) => handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="utoridInput">UTORID</label>
            <input
              id="utoridInput"
              type="text"
              value={utoridInput}
              onChange={(e) => setUtoridInput(e.target.value)}
              placeholder="e.g. luckyace"
              required
            />
            {badRequest && <p className="field-error">Unique, alphanumeric, 7-8 characters.</p>}
            {noUser && <p className="field-error">We could not find an account with that UTORID.</p>}
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your password"
              required
            />
            {badRequest && <p className="field-error">8-20 characters with uppercase, lowercase, number, and symbol.</p>}
            {incorretPassword && <p className="field-error">Incorrect password.</p>}
          </div>

          <button type="submit" className="login-button">Login</button>
        </form>

        <div className="register-link">
          <p>
            <Link to="/">Return to homepage</Link><br />
            <Link to="/reset_token">Forget Password?</Link>
          </p>
        </div>
      </div>
    </div>
  );

}

export default Login;