import { QRCodeSVG } from 'qrcode.react'
import { useLoggedInUser } from '../contexts/LoggedInUserContext'
import { useState, useEffect } from 'react';
import "./QRInitTransaction.css";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

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

  const qrValue = user ? `${REACT_APP_BACKEND_URL}/qr_init_detail/${user.utorid}` : "";

  return (
    <div className="page-shell qr-init-page" data-surface="flat">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Preparing your QR workspace.</p>
        </div>
      ) : (
        <section className="qr-transaction-card" data-surface="flat">
          <header className="qr-init-header">
            <p className="eyebrow">Wallet · QR Code</p>
            <h1 className="page-title">QR Init Transaction</h1>
            <p className="page-subtitle">Display this code so a cashier can start a transaction on your behalf.</p>
          </header>

          <div className="transaction-info">
            <div className="info-row">
              <span className="info-label">Name</span>
              <span className="info-value">{user?.name || "—"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">UTORid</span>
              <span className="info-value">{user?.utorid || "—"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Current Points</span>
              <span className="info-value">{user?.points ?? "—"}</span>
            </div>
          </div>

          <div className="qr-section">
            <h3>Your QR Code</h3>
            <QRCodeSVG value={qrValue} size={256} level="H" />
          </div>
        </section>
      )}
    </div>
  )
}

export default QRInitTransaction;