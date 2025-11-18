import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { registerUser } from "../APIRequest";

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
    }, 100);
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
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e)}>
          {success && <h3>{`Successfully registered an account for ${utoridShow}!`}</h3>}
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
            {conflict && <p>User with that UTORID already exists</p>}
          </div>
          <div>
            <label htmlFor="nameInput">Name: </label>
            <input
              id="nameInput"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
            {badRequest && <p>1-50 characters</p>}
          </div>
          <div>
            <label htmlFor="emailInput">Email: </label>
            <input
              id="emailInput"
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
            {badRequest && <p>Unique, Valid University of Toronto email</p>}
          </div>
          <button type="submit">Register</button>
        </form>
      )}
    </div>
  )
}

export default Register;