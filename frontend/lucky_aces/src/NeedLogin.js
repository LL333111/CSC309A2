import { useLoggedInUser } from "./contexts/LoggedInUserContext"
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';

function NeedLogin({ children, min_role }) {
  const { token, role, expiresAt, logout, loading } = useLoggedInUser();
  const hasChecked = useRef(false);
  const [_loading, _setLoading] = useState(true);

  const navigate = useNavigate();

  // loading
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (hasChecked.current || _loading) return;

    const checkAuth = () => {
      // check login
      if (token === null) {
        alert("You need to login to access this page.");
        hasChecked.current = true;
        navigate("/login");
      } else if (new Date() >= new Date(expiresAt)) {
        logout();
        alert("Your login has expired. Please log in again.");
        hasChecked.current = true;
        navigate("/login");
      }
      // check permission
      if (!hasChecked.current && role < min_role) {
        alert("You do not have the permission to access this page.");
        hasChecked.current = true;
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate, _loading]);

  return (children);
}

export default NeedLogin;