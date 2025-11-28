import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllTransactions } from "../APIRequest"
import "./AllTransactions.css"

function AllTransactions() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [transactionList, setTransactionList] = useState([]);

  const [typeFilter, setTypeFilter] = useState("any");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [suspiciousFilter, setSuspiciousFilter] = useState("any");
  const [promotionIdFilter, setPromotionIdFilter] = useState("");
  const [relatedIdFilter, setRelatedIdFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("any");

  const { loading, token } = useLoggedInUser();
  const navigate = useNavigate();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchTransactions = async () => {
    try {
      let type = typeFilter !== "any" ? typeFilter : null;
      let createdBy = createdByFilter || null;
      let suspicious = suspiciousFilter !== "any" ? suspiciousFilter : null;
      let promotionId = promotionIdFilter ? parseInt(promotionIdFilter) : null;
      let relatedId = relatedIdFilter ? parseInt(relatedIdFilter) : null;
      let amount = amountFilter ? parseFloat(amountFilter) : null;
      let operator = operatorFilter !== "any" ? operatorFilter : null;

      const data = await getAllTransactions(
        null,
        type,
        page,
        createdBy,
        suspicious,
        promotionId,
        relatedId,
        amount,
        operator,
        token
      );
      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }

      setTransactionList(data.results);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchTransactions();
    }
  }, [page, _loading, totalPage]);

  const handlePrevious = (e) => {
    e.preventDefault();
    setPage(page === 1 ? 1 : page - 1);
  }

  const handleNext = (e) => {
    e.preventDefault();
    setPage(page === totalPage ? page : page + 1);
  }

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  }

  const handleApply = async (e) => {
    e.preventDefault();

    if (relatedIdFilter && typeFilter === "any") {
      alert("When using the Related ID filter, the type must be selected.");
      return;
    }

    if (amountFilter && operatorFilter === "any") {
      alert("When using the amount filter, you must select the operator.");
      return;
    }

    setPage(1);
    setTotalPage(null);
    fetchTransactions();
  }

  const handleReset = (e) => {
    e.preventDefault();
    setTypeFilter("any");
    setCreatedByFilter("");
    setSuspiciousFilter("any");
    setPromotionIdFilter("");
    setRelatedIdFilter("");
    setAmountFilter("");
    setOperatorFilter("any");
    setPage(1);
    setTotalPage(null);
    fetchTransactions();
  }

  const formatNumber = (value) => value === null || value === undefined ? "—" : Number(value).toLocaleString();

  const formatAmount = (transaction) => {
    switch (transaction.type) {
      case "purchase":
        return `${formatNumber(transaction.amount ?? transaction.spent)} pts`;
      case "redemption":
        return `-${formatNumber(transaction.redeemed)} pts`;
      case "adjustment":
        return `${formatNumber(transaction.amount)} pts`;
      case "transfer":
        return `${formatNumber(transaction.sent)} pts`;
      case "event":
        return `${formatNumber(transaction.awarded)} pts`;
      default:
        return `${formatNumber(transaction.amount)} pts`;
    }
  };

  const getPrimaryParty = (transaction) => {
    switch (transaction.type) {
      case "transfer":
        return transaction.sender ? `Sender: ${transaction.sender}` : "Sender: —";
      case "event":
        return transaction.recipient ? `Recipient: ${transaction.recipient}` : "Recipient: —";
      default:
        return transaction.utorid ? `User: ${transaction.utorid}` : "User: —";
    }
  };

  const getSecondaryParty = (transaction) => {
    switch (transaction.type) {
      case "transfer":
        return transaction.recipient ? `Recipient: ${transaction.recipient}` : null;
      case "event":
        return transaction.relatedId ? `Event ID: ${transaction.relatedId}` : null;
      case "adjustment":
        return transaction.relatedId ? `Related Tx: ${transaction.relatedId}` : null;
      case "redemption":
        return transaction.relatedId ? `Processed by #${transaction.relatedId}` : "Unprocessed";
      default:
        return null;
    }
  };

  const getPromotionSummary = (transaction) => {
    if (!transaction.promotionIds || transaction.promotionIds.length === 0) {
      return "No promotion";
    }
    return `Promo ${transaction.promotionIds.map((promo) => `#${promo.id}`).join(", ")}`;
  };

  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";

  return (
    <div className="page-shell transactions-page">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
        </div>
      ) : (
        <>
          <header className="transactions-header" data-surface="flat">
            <div>
              <p className="eyebrow">Ledger · Transactions</p>
              <h1 className="page-title">All Transactions</h1>
              <p className="page-subtitle">Audit every transaction with precise filters and quick links.</p>
            </div>
            <div className="header-actions">
              <button className="filter-toggle-btn" onClick={toggleFilter}>
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </header>

          {isFilterOpen && (
            <section className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="type-filter">Type</label>
                  <select
                    id="type-filter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="purchase">Purchase</option>
                    <option value="redemption">Redemption</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="event">Event</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="createdBy-filter">Created By</label>
                  <input
                    type="text"
                    id="createdBy-filter"
                    value={createdByFilter}
                    onChange={(e) => setCreatedByFilter(e.target.value)}
                    placeholder="UTORID"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="suspicious-filter">Suspicious</label>
                  <select
                    id="suspicious-filter"
                    value={suspiciousFilter}
                    onChange={(e) => setSuspiciousFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="promotionId-filter">Promotion ID</label>
                  <input
                    type="number"
                    id="promotionId-filter"
                    value={promotionIdFilter}
                    onChange={(e) => setPromotionIdFilter(e.target.value)}
                    placeholder="Promotion ID"
                    min="1"
                    step="1"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="relatedId-filter">Related ID</label>
                  <input
                    type="number"
                    id="relatedId-filter"
                    value={relatedIdFilter}
                    onChange={(e) => setRelatedIdFilter(e.target.value)}
                    placeholder="Related ID"
                    min="1"
                    step="1"
                  />
                  {relatedIdFilter && typeFilter === "any" && (
                    <small>When using the Related ID filter, the type must be selected.</small>
                  )}
                </div>
                <div className="filter-group">
                  <label htmlFor="operator-filter">Amount Operator</label>
                  <select
                    id="operator-filter"
                    value={operatorFilter}
                    onChange={(e) => setOperatorFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="gte">Greater or Equal</option>
                    <option value="lte">Less or Equal</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="amount-filter">Amount</label>
                  <input
                    type="number"
                    id="amount-filter"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    placeholder="Amount"
                    step="0.01"
                  />
                  {amountFilter && operatorFilter === "any" && (
                    <small>When using the amount filter, you must select the operator.</small>
                  )}
                </div>
              </div>
              <div className="filter-actions">
                <button className="apply-btn" onClick={handleApply}>Apply</button>
                <button className="reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <section className="table-card" data-surface="flat">
            {transactionList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>No transactions found</h3>
                <p>Try broadening your filters or refresh the search.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table transactions-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Type</th>
                      <th>Parties</th>
                      <th>Amount</th>
                      <th>Promotions / Flags</th>
                      <th>Created By</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionList.map((transaction) => {
                      const primaryParty = getPrimaryParty(transaction);
                      const secondaryParty = getSecondaryParty(transaction);
                      const promotionSummary = getPromotionSummary(transaction);
                      const typeLabel = capitalize(transaction.type);

                      return (
                        <tr key={transaction.id}>
                          <td>
                            <div className="table-cell-primary">
                              <p className="table-title">Transaction #{transaction.id}</p>
                              {transaction.remark && <p className="table-meta">{transaction.remark}</p>}
                            </div>
                          </td>
                          <td>
                            <span className="table-chip is-muted">{typeLabel}</span>
                          </td>
                          <td>
                            <div className="table-meta-stack">
                              <span>{primaryParty}</span>
                              {secondaryParty && <span className="table-meta">{secondaryParty}</span>}
                            </div>
                          </td>
                          <td>{formatAmount(transaction)}</td>
                          <td>
                            <div className="table-meta-stack">
                              <span>{promotionSummary}</span>
                              {transaction.suspicious && (
                                <span className="table-chip is-danger">Flagged</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="table-meta-stack">
                              <span>{transaction.createdBy || "—"}</span>
                              {transaction.updatedAt && (
                                <span className="table-meta">Updated: {new Date(transaction.updatedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => navigate(`/specific_transaction/${transaction.id}`)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {transactionList.length > 0 && (
            <section className="pagination" data-surface="flat">
              <button onClick={handlePrevious} disabled={page === 1}>
                Previous Page
              </button>
              <span>
                Page {page} of {totalPage || 1}
              </span>
              <button onClick={handleNext} disabled={page === totalPage}>
                Next Page
              </button>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default AllTransactions;