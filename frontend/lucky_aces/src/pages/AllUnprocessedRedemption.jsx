import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllUnprocessedRedemption } from "../APIRequest";
import { QRCodeSVG } from "qrcode.react";
import "./AllUnprocessedRedemption.css";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

function AllUnprocessedRedemption() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [redemptionList, setRedemptionList] = useState([]);
  const [activeQrId, setActiveQrId] = useState(null);

  const { loading, token } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchRedemptions = async () => {
    try {
      const data = await getAllUnprocessedRedemption(page, token);
      const pages = Math.max(1, Math.ceil(data.count / 5));
      setTotalPage(pages);
      setRedemptionList(data.results);
      if (!data.results.find((item) => item.id === activeQrId)) {
        setActiveQrId(null);
      }
    } catch (error) {
      console.error("Failed to fetch pending redemptions:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchRedemptions();
    }
  }, [page, _loading]);

  const handlePrevious = (e) => {
    e.preventDefault();
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setPage((prev) => Math.min(totalPage, prev + 1));
  };

  const toggleQRCode = (id) => {
    setActiveQrId((current) => (current === id ? null : id));
  };

  const formatPoints = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }
    return `${Number(value).toLocaleString()} pts`;
  };

  const selectedRedemption = redemptionList.find((item) => item.id === activeQrId);
  const qrLink = `${REACT_APP_BACKEND_URL}process_redemption/${selectedRedemption.id}`;

  return (
    <div className="page-shell redemptions-page">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading pending redemptions...</h2>
          <p>Pulling the latest unprocessed requests.</p>
        </div>
      ) : (
        <>
          <header className="redemptions-header" data-surface="flat">
            <div>
              <p className="eyebrow">Redemptions · Pending</p>
              <h1 className="page-title">Unprocessed Redemptions</h1>
              <p className="page-subtitle">Review outstanding redemption requests and process them in seconds.</p>
            </div>
          </header>

          <section className="table-card" data-surface="flat">
            {redemptionList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🧾</div>
                <h3>No pending redemptions</h3>
                <p>All redemption requests are processed. Check back later.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table redemptions-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptionList.map((redemption) => (
                      <tr key={redemption.id}>
                        <td>
                          <div className="table-cell-primary">
                            <p className="table-title">Transaction #{redemption.id}</p>
                            <p className="table-meta">Awaiting confirmation</p>
                          </div>
                        </td>
                        <td>
                          <div className="table-meta-stack">
                            <span>{redemption.utorid ? `User: ${redemption.utorid}` : "User: —"}</span>
                            <span className="table-meta">
                              {redemption.createdBy ? `Created by ${redemption.createdBy}` : "Created automatically"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="table-chip is-muted">{formatPoints(redemption.amount)}</span>
                        </td>
                        <td>
                          <div className="table-meta-stack">
                            <span>{redemption.remark || "No remarks provided"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => toggleQRCode(redemption.id)}
                            >
                              {activeQrId === redemption.id ? "Hide QR" : "QR Code"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedRedemption && (
            <section className="qr-preview-card" data-surface="flat">
              <div className="qr-preview-header">
                <div>
                  <p className="eyebrow">Scan to process</p>
                  <h3>Transaction #{selectedRedemption.id}</h3>
                  <p>{selectedRedemption.remark || "No remarks"}</p>
                </div>
                <span className="table-chip is-warning">Pending</span>
              </div>
              <div className="qr-preview-body">
                <QRCodeSVG value={qrLink} size={160} level="M" />
                <div className="qr-preview-meta">
                  <span>{selectedRedemption.utorid ? `User: ${selectedRedemption.utorid}` : "User unknown"}</span>
                  <span>{formatPoints(selectedRedemption.amount)}</span>
                </div>
                <p className="qr-preview-hint">Share this QR with the staff member processing the redemption.</p>
              </div>
            </section>
          )}

          {redemptionList.length > 0 && (
            <section className="pagination" data-surface="flat">
              <button onClick={handlePrevious} disabled={page === 1}>
                Previous Page
              </button>
              <span>
                Page {page} of {totalPage}
              </span>
              <button onClick={handleNext} disabled={page === totalPage}>
                Next Page
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default AllUnprocessedRedemption;