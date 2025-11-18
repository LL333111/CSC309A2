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

// /users
export async function registerUser(utorid, name, email, token) {
  try {
    const response = await fetch(`${API}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid,
        name,
        email,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("Register User API request error: ", error);
    alert("Register User API request error");
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

export async function updateLoggedInUser(name, email, birthday, avatar, token) {
  try {
    const response = await fetch(`${API}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        birthday,
        avatar,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("update LoggedIn User API request error: ", error);
    alert("update LoggedIn User API request error");
  }
}

// /users/me/password
export async function changePassword(oldPassword, newPassword, token) {
  try {
    const response = await fetch(`${API}/users/me/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        old: oldPassword,
        new: newPassword,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("update LoggedIn User API request error: ", error);
    alert("update LoggedIn User API request error");
  }
}

// /users/:userId/transactions
export async function transferTransaction(recipientId, amount, remark, token) {
  try {
    const response = await fetch(`${API}/users/${recipientId}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "transfer",
        amount: Number(amount),
        remark: remark === "" ? null : remark,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("update LoggedIn User API request error: ", error);
    alert("update LoggedIn User API request error");
  }
}