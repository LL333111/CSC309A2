import { useState, createContext, useEffect, useContext } from "react"
import { getLoggedInUser } from "../APIRequest"

const LoggedInUserContext = createContext(null);

export const LoggedInUserContextProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(0);

  // Whenever the token changes
  // get current logged-in user by api request
  useEffect(() => {
    // get current use profile
    if (token === null) {
      // no loggedIn user
      setUser(null);
      setRole(0);
    } else {
      setLoading(true);
      async function getUser() {
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
        setLoading(false);
      }
      getUser();
    }
  }, [token]);

  const login = (newToken, newExpiresAt) => {
    setToken(newToken);
    setExpiresAt(newExpiresAt);
    // user will be setted by useEffect if token is valid
    // because token was changed
  }

  const logout = () => {
    setLoading(true);
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
    }}>
      {children}
    </LoggedInUserContext.Provider>
  )
}

export const useLoggedInUser = () => {
  return useContext(LoggedInUserContext);
}