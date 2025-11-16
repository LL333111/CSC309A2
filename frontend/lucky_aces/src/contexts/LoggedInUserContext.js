import React, { useState, createContext, useEffect, useContext } from "react"

const LoggedInUserContext = createContext(null);

export const LoggedInUserContextProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Whenever the token changes
  // get current logged-in user by api request
  useEffect(() => {
    // 待完成
    // 我的想法是做一个专门请求后端的js文件(里面专门请求)
    // 这里import->使用->handle data
  }, [token]);

  const login = (newToken, newExpiresAt) => {
    setToken(newToken);
    setExpiresAt(newExpiresAt);
    // user will be setted by useEffect if token is valid
    // because token was changed
  }

  const logout = () => {
    setToken(null);
    setExpiresAt(null);
    // user will be setted by useEffect
    // because token was changed
  }

  return (
    <LoggedInUserContext.Provider value={{
      token,
      expiresAt,
      user,
      loading,
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