const API = "http://localhost:3001";

// /auth/tokens
export async function login(utorid, password) {
  try {
    // request
    const response = await fetch(`${API}/auth/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        utorid,
        password,
      })
    });

    if (!response.ok) {
      return response.status;
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Log in API request error: ", error);
    alert("Log in API request error");
  }
}

// /users/me
export async function getLoggedInUser(token) {
  try {
    const response = await fetch(`${API}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get LoggedIn User ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get LoggedIn User API request error: ", error);
    alert("get LoggedIn User API request error");
  }
}
