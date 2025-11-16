import React, { useState, useEffect } from "react";

function Auth() {
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        let responseData = JSON.parse(this.responseText);
        setToken(responseData.token);
        setExpiresAt(responseData.expiresAt);
      }
    }
    req.open("POST", "http://localhost:3001/auth/tokens", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({
      "utorid": "shepard",
      "password": "123456cC!"
    }));
  }, []);

  // useEffect(() => {
  //   async function getData () {
  //     const res = await fetch("http://localhost:3001/auth/tokens",{
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         utorid: "shepard",
  //         password: "123456cC!"
  //       })
  //     });
  //     const jsonRes = await res.json();
  //     setToken(jsonRes.data.token);
  //     setExpiresAt(jsonRes.data.expiresAt);
  //   }
  //   getData();
  // }, []);

  return (
    <div>
      <p>{token}</p>
      <p>{expiresAt}</p>
    </div>
  )
}

export default Auth