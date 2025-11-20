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
    console.error("change password API request error: ", error);
    alert("change password API request error");
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
    console.error("create transfer transaction API request error: ", error);
    alert("create transfer transaction API request error");
  }
}

// /users/me/transactions
export async function redemptionTransaction(amount, remark, token) {
  try {
    const response = await fetch(`${API}/users/me/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "redemption",
        amount: Number(amount),
        remark: remark === "" ? null : remark,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("create redemption transaction API request error: ", error);
    alert("create redemption transaction API request error");
  }
}

// function for all unprocessed redemption
export async function getAllUnprocessedRedemption(page, token) {
  try {
    const response = await fetch(`${API}/users/me/transactions?type=redemption&processedBy=true&page=${page}&limit=5`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get all unprocessed RedemptionTransaction ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all redemption transaction API request error: ", error);
    alert("get all redemption transaction API request error");
  }
}

// /promotions
export async function getAllPromotions(name, type, page, started, ended, token, regular) {
  try {
    const response = await fetch(`${API}/promotions?page=${page}&limit=5${name === null ? "" : `&name=${name}`}${type === null ? "" : `&type=${type}`}${started === null ? "" : `&started=${started}`}${ended === null ? "" : `&ended=${ended}`}${regular === "true" ? `&regular=true` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get all promotions ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all promotions API request error: ", error);
    alert("get all promotions API request error");
  }
}

// /events
export async function getAllEvents(name, page, started, ended, location, showFull, published, token) {
  try {
    const response = await fetch(`${API}/events?page=${page}&limit=5${name === null ? "" : `&name=${name}`}${location === null ? "" : `&location=${location}`}${showFull === null ? "" : `&showFull=${showFull}`}${published === null ? "" : `&published=${published}`}${started === null ? "" : `&started=${started}`}${ended === null ? "" : `&ended=${ended}`}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get all promotions ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all promotions API request error: ", error);
    alert("get all promotions API request error");
  }
}

// /users
export async function getAllUsers(name, page, role, verified, activated, token) {
  try {
    const response = await fetch(`${API}/users?page=${page}&limit=5${name === null ? "" : `&name=${name}`}${role === null ? "" : `&role=${role}`}${verified === null ? "" : `&verified=${verified}`}${activated === null ? "" : `&activated=${activated}`}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token} `,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get all promotions ${response.statusText} `);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all promotions API request error: ", error);
    alert("get all promotions API request error");
  }
}