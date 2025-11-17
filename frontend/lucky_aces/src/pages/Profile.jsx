import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getLoggedInUser } from "../APIRequest"

function Profile() {
  const [_loading, _setLoading] = useState(true);
  const { loading, user } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

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
            <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
            {user.birthday === null && <p><strong>Birthday:</strong> {new Date(user.birthday).toLocaleDateString()}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;