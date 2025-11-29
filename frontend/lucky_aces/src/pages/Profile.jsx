import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useNavigate } from "react-router-dom";
import { updateLoggedInUser, changePassword } from "../APIRequest";
import "./Profile.css";

function Profile() {
  const [_loading, _setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const { loading, user, logout, token, update, setUpdate } = useLoggedInUser();
  const navigate = useNavigate();

  // Edit Profile States
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [editBadRequest, setEditBadRequest] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Change Password States
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [passwordBadRequest, setPasswordBadRequest] = useState(false);
  const [passwordUnauthorized, setPasswordUnauthorized] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      setEmailInput(user.email || "");
      setBirthdayInput(user.birthday || "");
      setAvatarInput(user.avatarUrl || "");
    }
  }, [user]);

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogout = () => {
    logout();
    navigate("/");
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    let email = emailInput === user.email ? null : emailInput;

    const response = await updateLoggedInUser(nameInput, email, birthdayInput, avatarInput, token);
    switch (response) {
      case 400:
        setEditBadRequest(true);
        setEditSuccess(false);
        break;
      case 404:
        alert("There are some issues with your login status. Please log in again.");
        navigate("/login");
        break;
      case 200:
        setEditBadRequest(false);
        setEditSuccess(true);
        setUpdate(!update);
        setTimeout(() => {
          setActiveTab('view');
          setEditSuccess(false);
        }, 2000);
        break;
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const response = await changePassword(oldPasswordInput, newPasswordInput, token);
    switch (response) {
      case 400:
        setPasswordBadRequest(true);
        setPasswordUnauthorized(false);
        setPasswordSuccess(false);
        break;
      case 403:
        setPasswordBadRequest(false);
        setPasswordUnauthorized(true);
        setPasswordSuccess(false);
        break;
      case 200:
        setPasswordBadRequest(false);
        setPasswordUnauthorized(false);
        setPasswordSuccess(true);
        setOldPasswordInput("");
        setNewPasswordInput("");
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 3000);
        break;
    }
  }

  if (!user) {
    return (
      <div className="profile-container" data-surface="flat">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="profile-container" data-surface="flat">
      {_loading ? (
        <div className="loading">
          <h2>Loading...</h2>
        </div>
      ) : (
        <div className="profile-content">
          <h1>My Account</h1>

          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              View Profile
            </button>
            <button
              className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit Profile
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
          </div>

          {activeTab === 'view' && (
            <div className="tab-content">
              <div className="profile-info">
                {user.avatarUrl && (
                  <div className="avatar-section">
                    <img src={user.avatarUrl} alt="Avatar" className="avatar-image" />
                  </div>
                )}
                <div className="info-grid">
                  <div className="info-item">
                    <label>User ID:</label>
                    <span>{user.id}</span>
                  </div>
                  <div className="info-item">
                    <label>UTORID:</label>
                    <span>{user.utorid}</span>
                  </div>
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{user.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Points:</label>
                    <span className="points-badge">{user.points}</span>
                  </div>
                  <div className="info-item">
                    <label>Role:</label>
                    <span>{user.role === 1 ? 'Regular User' : user.role === 2 ? 'Cashier' : user.role === 3 ? 'Manager' : 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Verified:</label>
                    <span className={user.verified ? 'verified-yes' : 'verified-no'}>
                      {user.verified ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {user.birthday && (
                    <div className="info-item">
                      <label>Birthday:</label>
                      <span>{new Date(user.birthday).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="tab-content">
              <form onSubmit={handleEditSubmit} className="profile-form">
                {editSuccess && <div className="success-message">Successfully updated your profile!</div>}

                <div className="form-group">
                  <label htmlFor="nameInput">Name</label>
                  <input
                    id="nameInput"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailInput">Email</label>
                  <input
                    id="emailInput"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your.email@mail.utoronto.ca"
                  />
                  {editBadRequest && <p className="error-message">Unique, valid University of Toronto email required</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="birthdayInput">Birthday</label>
                  <input
                    id="birthdayInput"
                    type="date"
                    value={birthdayInput}
                    onChange={(e) => setBirthdayInput(e.target.value)}
                  />
                  {editBadRequest && <p className="error-message">Date format: YYYY-MM-DD</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="avatarInput">Avatar URL</label>
                  <input
                    id="avatarInput"
                    type="text"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="/uploads/avatars/your-avatar.jpg"
                  />
                </div>

                <button type="submit" className="submit-button">Update Profile</button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-content">
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                {passwordSuccess && <div className="success-message">Successfully changed your password!</div>}

                <div className="form-group">
                  <label htmlFor="oldPasswordInput">Current Password</label>
                  <input
                    id="oldPasswordInput"
                    type="password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    required
                    placeholder="Enter current password"
                  />
                  {passwordUnauthorized && <p className="error-message">Incorrect password</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="newPasswordInput">New Password</label>
                  <input
                    id="newPasswordInput"
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                    placeholder="Enter new password"
                  />
                  {passwordBadRequest && (
                    <p className="error-message">
                      8-20 characters, at least one uppercase, one lowercase, one number, one special character
                    </p>
                  )}
                </div>

                <button type="submit" className="submit-button">Change Password</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;