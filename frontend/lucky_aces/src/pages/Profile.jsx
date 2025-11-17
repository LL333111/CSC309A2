import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [_loading, _setLoading] = useState(true);
  const { loading, user, logout } = useLoggedInUser();

  const navigate = useNavigate();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogout = () => {
    logout();
    navigate("/");
  }

  if (!user) {
    // special case for logout
    return (
      <div>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <h1>User Profile</h1>
          <div>
            <p><strong>UTORID: </strong>{user.utorid}</p>
            <p><strong>Name: </strong>{user.name}</p>
            <p><strong>Email: </strong>{user.email}</p>
            <p><strong>Points: </strong>{user.points}</p>
            <p><strong>Role: </strong>{user.role}</p>
            <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
            {user.birthday === null && <p><strong>Birthday:</strong> {new Date(user.birthday).toLocaleDateString()}</p>}
            {/* you can add more profiles */}
          </div>
          <button onClick={() => handleLogout()}>Log out</button>
        </div>
      )}
    </div>
  );
}

export default Profile;