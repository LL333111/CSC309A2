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

export async function yourTransactions(type, page, promotionId, relatedId, amount, operator, token,) {
  try {
    const response = await fetch(`${API}/users/me/transactions?page=${page}&limit=5${type === null ? "" : `&type=${type}`}${promotionId === null ? "" : `&promotionId=${promotionId}`}${relatedId === null ? "" : `&relatedId=${relatedId}`}${amount === null ? "" : `&amount=${amount}`}${operator === null ? "" : `&operator=${operator}`}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get your transactions ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("find your transaction API request error: ", error);
    alert("find your transaction API request error");
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
      throw new Error(`Failed to get all unprocessed Redemption Transaction ${response.statusText}`);
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
      throw new Error(`Failed to get all events ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all events API request error: ", error);
    alert("get all events API request error");
  }
}

export async function createEvent(name, description, location, date, startTime, endTime, capacity, points, token) {
  try {
    const body = {
      name,
      description,
      location,
      startTime,
      endTime,
      points,
    };

    // Only include capacity if it's not null
    if (capacity !== null) {
      body.capacity = capacity;
    }

    const response = await fetch(`${API}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return response.status;
  } catch (error) {
    console.error("create event API request error: ", error);
    alert("create event API request error");
  }
}

// /events/:eventId
export async function getEventById(eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to get event by ID ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get event by ID API request error: ", error);
    alert("get event by ID API request error");
  }
}

export async function updateEventById(eventId, updateFields, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateFields),
    });

    if (!response.ok) {
      throw new Error(`Failed to update event by ID ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("update event by ID API request error: ", error);
    alert("update event by ID API request error");
  }
}

export async function deleteEventById(eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.status;
  } catch (error) {
    console.error("delete event by ID API request error: ", error);
    alert("delete event by ID API request error");
  }
}

// /events/:eventId/guests/me - RSVP to event
export async function rsvpToEvent(eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/guests/me`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return response.status;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("RSVP to event API request error: ", error);
    alert("RSVP to event API request error");
  }
}

// /events/:eventId/guests/me - Cancel RSVP
export async function cancelRsvpToEvent(eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/guests/me`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.status;
  } catch (error) {
    console.error("cancel RSVP to event API request error: ", error);
    alert("cancel RSVP to event API request error");
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
      throw new Error(`Failed to get all users ${response.statusText} `);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all users API request error: ", error);
    alert("get all users API request error");
  }
}

// /users/:userId
export async function getUserById(userId, token) {
  try {
    const response = await fetch(`${API}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token} `,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user by ID ${response.statusText} `);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get user by ID API request error: ", error);
    alert("get user by ID API request error");
  }
}

export async function updateUserById(userId, updateFields, token) {
  try {
    const response = await fetch(`${API}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token} `,
      },
      body: JSON.stringify(updateFields),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user by ID ${response.statusText} `);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("update user by ID API request error: ", error);
    alert("update user by ID API request error");
  }
}

// /transactions
export async function getAllTransactions(name, type, page, createdBy, suspicious, promotionId, relatedId, amount, operator, token,) {
  try {
    const response = await fetch(`${API}/transactions?page=${page}&limit=5${name === null ? "" : `&name=${name}`}${type === null ? "" : `&type=${type}`}${createdBy === null ? "" : `&createdBy=${createdBy}`}${suspicious === null ? "" : `&suspicious=${suspicious}`}${promotionId === null ? "" : `&promotionId=${promotionId}`}${relatedId === null ? "" : `&relatedId=${relatedId}`}${amount === null ? "" : `&amount=${amount}`}${operator === null ? "" : `&operator=${operator}`}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get all transactions ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get all transactions API request error: ", error);
    alert("get all transactions API request error");
  }
}

export async function createPurchase(utorid, spent, promotionIds, remark, token) {
  try {
    const response = await fetch(`${API}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid,
        type: "purchase",
        spent,
        promotionIds,
        remark: remark === null ? null : remark,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("create purchase transactions API request error: ", error);
    alert("create purchase transactions API request error");
  }
}

export async function createAdjustment(utorid, amount, relatedId, promotionIds, remark, token) {
  try {
    const response = await fetch(`${API}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid,
        type: "adjustment",
        amount,
        relatedId,
        promotionIds,
        remark: remark === null ? null : remark,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("create adjustment transactions API request error: ", error);
    alert("create adjustment transactions API request error");
  }
}

// /transactions/:transactionId
export async function getTransactionById(transactionId, token) {
  try {
    const response = await fetch(`${API}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transaction by ID ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get transaction by ID API request error: ", error);
    alert("get transaction by ID API request error");
  }
}


// /transactions/:transactionId/suspicious
export async function markTransactionSuspicious(transactionId, suspicious, token) {
  try {
    const response = await fetch(`${API}/transactions/${transactionId}/suspicious`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        suspicious,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("mark Transactio Suspicious API request error: ", error);
    alert("mark Transaction Suspicious API request error");
  }
}

// /transactions/:transactionId/processed
export async function processRedemption(transactionId, token) {
  try {
    const response = await fetch(`${API}/transactions/${transactionId}/processed`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        processed: true,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("process Redemption API request error: ", error);
    alert("process Redemption API request error");
  }
}

// / /promotions 
export async function createPromotion(name, description, type, startTime, endTime, minSpending, rate, points, token) {
  try {
    const body = {
      name,
      description,
      type,
      startTime,
      endTime,
    };

    // Add optional fields only if they're not null
    if (minSpending !== null) {
      body.minSpending = minSpending;
    }
    if (rate !== null) {
      body.rate = rate;
    }
    if (points !== null) {
      body.points = points;
    }

    const response = await fetch(`${API}/promotions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return response.status;
  } catch (error) {
    console.error("create promotion API request error: ", error);
    alert("create promotion API request error");
  }
}

// / promotions/:promotionId
export async function getPromotionById(promotionId, token) {
  try {
    const response = await fetch(`${API}/promotions/${promotionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get promotion by ID ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get promotion by ID API request error: ", error);
    alert("get promotion by ID API request error");
  }
}

export async function updatePromotionById(promotionId, updateFields, token) {
  try {
    const response = await fetch(`${API}/promotions/${promotionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateFields),
    });

    if (!response.ok) {
      throw new Error(`Failed to update promotion by ID ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("update promotion by ID API request error: ", error);
    alert("update promotion by ID API request error");
  }
}

export async function deletePromotionById(promotionId, token) {
  try {
    const response = await fetch(`${API}/promotions/${promotionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.status;
  } catch (error) {
    console.error("delete promotion by ID API request error: ", error);
    alert("delete promotion by ID API request error");
  }
}

// /users/me/organizers
export async function getOrganizerEvents(page, token) {
  try {
    const response = await fetch(`${API}/users/me/organizers?page=${page}&limit=5`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get organizers events ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("get organizers events API request error: ", error);
    alert("get organizers events API request error");
  }
}

// /events/:eventId/transactions
export async function createRewardTransaction(amount, utorid, remark, token, eventId) {
  try {
    const response = await fetch(`${API}/events/${eventId}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid: utorid === "" ? null : utorid,
        type: "event",
        amount: Number(amount),
        remark: remark === null ? null : remark,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("create adjustment transactions API request error: ", error);
    alert("create adjustment transactions API request error");
  }
}

// /events/:eventId/organizers
export async function addOrganizer(utorid, eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/organizers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("add organizer API request error: ", error);
    alert("add organizer API request error");
  }
}

// /events/:eventId/organizers/:userId
export async function removeOrganizer(eventId, userId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/organizers/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.status;
  } catch (error) {
    console.error("remove organizer API request error: ", error);
    alert("remove organizer API request error");
  }
}

// /events/:eventId/guests
export async function addGuest(utorid, eventId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        utorid,
      }),
    });

    return response.status;
  } catch (error) {
    console.error("add guests API request error: ", error);
    alert("add guests API request error");
  }
}

// /events/:eventId/organizers/:userId
export async function removeGuest(eventId, userId, token) {
  try {
    const response = await fetch(`${API}/events/${eventId}/guests/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.status;
  } catch (error) {
    console.error("remove guests API request error: ", error);
    alert("remove guests API request error");
  }
}