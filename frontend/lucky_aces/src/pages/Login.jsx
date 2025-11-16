import React, { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [utoridInput, setUtoridInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();
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
        </div>
        <button type="submit">Login</button>
      </form>
      <Link to="/">Reset Password</Link>
    </div>
  )

}

export default Login;