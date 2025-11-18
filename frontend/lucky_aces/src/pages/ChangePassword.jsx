import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { changePassword } from "../APIRequest";

function Register() {
  const [_loading, _setLoading] = useState(true);
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  const [badRequest, _setBadRequest] = useState(false);
  const [unauthorized, _setUnauthorized] = useState(false);
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

    const response = await changePassword(oldPasswordInput, newPasswordInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setUnauthorized(false);
        _setSuccess(false);
        break;
      case 403:
        _setBadRequest(false);
        _setUnauthorized(true);
        _setSuccess(false);
        break;
      case 200:
        _setBadRequest(false);
        _setUnauthorized(false);
        _setSuccess(true);
        setOldPasswordInput("");
        setNewPasswordInput("");
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
          {success && <h3>{`Successfully changed your password!`}</h3>}
          <div>
            <label htmlFor="oldPasswordInput">Old Password: </label>
            <input
              id="oldPasswordInput"
              type="text"
              value={oldPasswordInput}
              onChange={(e) => setOldPasswordInput(e.target.value)}
              required
            />
            {unauthorized && <p>Incorrect password</p>}
          </div>
          <div>
            <label htmlFor="newPasswordInput">New Password: </label>
            <input
              id="newPasswordInput"
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              required
            />
            {badRequest && <p>8-20 characters, at least one uppercase, one lowercase, one number, one special character</p>}
          </div>
          <button type="submit">Register</button>
        </form>
      )}
    </div>
  )
}

export default Register;