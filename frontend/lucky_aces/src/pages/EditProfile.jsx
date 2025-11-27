import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { updateLoggedInUser } from "../APIRequest";

function EditProfile() {
  const [_loading, _setLoading] = useState(true);
  const [badRequest, _setBadRequest] = useState(false);
  const [success, _setSuccess] = useState(false);

  const { token, user, loading, update, setUpdate } = useLoggedInUser();
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState(user !== null ? user.name : "");
  const [emailInput, setEmailInput] = useState(user !== null ? user.email : "");
  const [birthdayInput, setBirthdayInput] = useState(user !== null ? user.birthday : "");
  const [avatarInput, setAvatarInput] = useState(user !== null ? user.avatarUrl : "");

  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      setEmailInput(user.email || "");
      setBirthdayInput(user.birthday || "");
      setAvatarInput(user.avatarUrl || "");
    }
  }, [user]);

  // loading
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await updateLoggedInUser(nameInput, emailInput, birthdayInput, avatarInput, token);
    switch (response) {
      case 400:
        _setBadRequest(true);
        _setSuccess(false);
        break;
      case 404:
        alert("There are some issues with your login status.Please log in again.");
        navigate("/login");
        break;
      case 200:
        _setBadRequest(false);
        _setSuccess(true);
        setUpdate(!update);
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
          <h1>Edit Your Profile</h1>
          {success && <h3>{`Successfully update your profile!`}</h3>}
          <div>
            <label htmlFor="nameInput">Name: </label>
            <input
              id="nameInput"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            {badRequest && <p>8-20 characters, at least one uppercase, one lowercase, one number, one special character</p>}
          </div>
          <div>
            <label htmlFor="emailInput">Email: </label>
            <input
              id="emailInput"
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            {badRequest && <p>Unique, Valid University of Toronto email</p>}
          </div>
          <div>
            <label htmlFor="birthdayInput">Birthday: </label>
            <input
              id="birthdayInput"
              type="text"
              value={birthdayInput}
              onChange={(e) => setBirthdayInput(e.target.value)}
            />
            {badRequest && <p>A date in the format of YYYY-MM-DD</p>}
          </div>
          <div>
            <label htmlFor="avatarInput">Avatar: </label>
            <input
              id="avatarInput"
              type="text"
              value={avatarInput}
              onChange={(e) => setAvatarInput(e.target.value)}
            />
            {badRequest && <p>Image file for the user's avatar under "/uploads/avatars" path</p>}
          </div>
          <button type="submit">Update Profile</button>
        </form>
      )}
    </div>
  )
}

export default EditProfile;