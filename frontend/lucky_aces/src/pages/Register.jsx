import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { registerUser } from "../APIRequest";
import "./Register.css";

function Register() {
  const [_loading, _setLoading] = useState(true);
  const [utoridInput, setUtoridInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("@mail.utoronto.ca");
  const [utoridShow, _setUtoridShow] = useState("");

  const [badRequest, _setBadRequest] = useState(false);
  const [conflict, _setConflict] = useState(false);
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

    const response = await registerUser(utoridInput, nameInput, emailInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setConflict(false);
        _setSuccess(false);
        break;
      case 409:
        _setBadRequest(false);
        _setConflict(true);
        _setSuccess(false);
        break;
      case 201:
        _setUtoridShow(utoridInput);
        _setBadRequest(false);
        _setConflict(false);
        _setSuccess(true);
        setUtoridInput("");
        setNameInput("");
        setEmailInput("@mail.utoronto.ca");
        break
    }
  }

  return (
    <div className="register-container" data-surface="flat">
      {_loading ? (
        <div className="loading">
          <h2>Loading cashier tools...</h2>
        </div>
      ) : (
        <div className="register-card">
          <p className="eyebrow">Directory · Registration</p>
          <h1 className="page-title">Register a new account</h1>
          <p className="register-subtitle">Only managers can onboard new users. All roles inherit campus security policies.</p>
          {success && <div className="success-message">Successfully registered an account for {utoridShow}.</div>}
          {conflict && <div className="error-message">A user with that UTORID already exists.</div>}
          {badRequest && <div className="info-message">Double-check validation rules before submitting again.</div>}
          <form className="register-form" onSubmit={(e) => handleSubmit(e)}>
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
              <label htmlFor="nameInput">Full name</label>
              <input
                id="nameInput"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Name as shown on badge"
                required
              />
              {badRequest && <p className="field-error">Must be 1-50 characters.</p>}
            </div>

            <div className="form-group">
              <label htmlFor="emailInput">UToronto email</label>
              <input
                id="emailInput"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              {badRequest && <p className="field-error">Must be a valid University of Toronto email.</p>}
            </div>

            <button type="submit" className="register-button">Register user</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Register;