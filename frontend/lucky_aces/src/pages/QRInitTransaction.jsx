import { QRCodeSVG } from 'qrcode.react'
import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';

function QRInitTransaction() {
  const [_loading, _setLoading] = useState(true);

  const { user, loading } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <h1>Init a Transaction</h1>
          <div>
            <p><strong>Current Points: </strong>{user.points}</p>
            <h3>Your QR Code</h3>
            <div>
              <QRCodeSVG value={user.utorid} size={256} level="H" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRInitTransaction;