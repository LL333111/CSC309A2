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
    })

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
