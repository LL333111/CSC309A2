import { useState, createContext, useEffect, useContext } from "react"
import { getLoggedInUser } from "../APIRequest"

const LoggedInUserContext = createContext(null);

export const LoggedInUserContextProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(0);
  const [update, setUpdate] = useState(true);

  // Whenever the token changes
  // get current logged-in user by api request
  useEffect(() => {
    setLoading(true);
    // get current use profile
    async function getUser(token) {
      const response = await getLoggedInUser(token);
      setUser(response);
      if (response.role === "regular") {
        setRole(1);
      } else if (response.role === "cashier") {
        setRole(2);
      } else if (response.role === "manager") {
        setRole(3);
      } else if (response.role === "superuser") {
        setRole(4);
      } else {
        throw new Error("invalid user role");
      }
    }
    // check token
    if (token === null) {
      if (localStorage.getItem("token") === null && localStorage.getItem("tokenExpiresAt") === null) {
        // no loggedIn user
        setUser(null);
        setRole(0);
      } else {
        // local storage has token
        getUser(localStorage.getItem("token"));
        setToken(localStorage.getItem("token"));
        setExpiresAt(localStorage.getItem("tokenExpiresAt"));
      }
    } else {
      getUser(token);
    }
    setLoading(false);
  }, [token, update]);

  const login = (newToken, newExpiresAt) => {
    setToken(newToken);
    setExpiresAt(newExpiresAt);
    // user will be setted by useEffect if token is valid
    // because token was changed
    localStorage.setItem("token", newToken);
    localStorage.setItem("tokenExpiresAt", newExpiresAt);
  }

  const logout = () => {
    setLoading(true);
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
    setToken(null);
    setExpiresAt(null);
    setLoading(false);
    // user will be setted by useEffect
    // because token was changed
  }

  return (
    <LoggedInUserContext.Provider value={{
      token,
      expiresAt,
      user,
      loading,
      role,
      login,
      logout,
      update,
      setUpdate,
    }}>
      {children}
    </LoggedInUserContext.Provider>
  )
}

export const useLoggedInUser = () => {
  return useContext(LoggedInUserContext);
}