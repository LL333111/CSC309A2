import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as APIlogin } from "../APIRequest";
import { useLoggedInUser } from "../contexts/LoggedInUserContext"

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
    } else {
      login(response.token, response.expiresAt);
      navigate("/profile");
    }
  }

  return (
    <div>
      <form onSubmit={(e) => handleSubmit(e)}>
        <div>
          <label htmlFor="utoridInput">UTORID</label>
          <input
            id="utoridInput"
            type="text"
            value={utoridInput}
            onChange={(e) => setUtoridInput(e.target.value)}
            required
          />
          {badRequest && <p>Unique, Alphanumeric, 7-8 characters</p>}
          {noUser && <p>No user with given utorid</p>}
        </div>
        <div>
          <label htmlFor="passwordInput">Password</label>
          <input
            id="passwordInput"
            type="text"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            required
          />
          {badRequest && <p>8-20 characters, at least one uppercase, one lowercase, one number, one special character</p>}
          {incorretPassword && <p>Incorrect password</p>}
        </div>
        <button type="submit">Login</button>
      </form>
      <Link to="/">Reset Password</Link>
    </div>
  )

}

export default Login;