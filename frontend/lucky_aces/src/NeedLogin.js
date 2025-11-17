import { useLoggedInUser } from "./contexts/LoggedInUserContext"
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from 'react';

function NeedLogin({ children }) {
  const { token, expiresAt, logout } = useLoggedInUser();
  const hasChecked = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (hasChecked.current) return;

    const checkAuth = () => {
      if (token === null) {
        alert("You need to login to access this page.");
        navigate("/login");
      } else if (new Date() >= new Date(expiresAt)) {
        logout();
        alert("Your login has expired. Please log in again.");
        navigate("/login");
      }
      hasChecked.current = true;
    };
    checkAuth();
  }, [navigate]);

  return children;
}

export default NeedLogin;