import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { yourTransactions } from "../APIRequest";
import "./YourTransactions.css";

function YourTransactions() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [transactionList, setTransactionList] = useState([]);

  const [typeFilter, setTypeFilter] = useState("any");
  const [promotionIdFilter, setPromotionIdFilter] = useState("");
  const [relatedIdFilter, setRelatedIdFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("any");

  const { loading, token, user } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchTransactions = async (targetPage = page) => {
    try {
      const type = typeFilter !== "any" ? typeFilter : null;
      const promotionId = promotionIdFilter ? parseInt(promotionIdFilter, 10) : null;
      const relatedId = relatedIdFilter ? parseInt(relatedIdFilter, 10) : null;
      const amount = amountFilter ? parseFloat(amountFilter) : null;
      const operator = operatorFilter !== "any" ? operatorFilter : null;

      const data = await yourTransactions(
        type,
        targetPage,
        promotionId,
        relatedId,
        amount,
        operator,
        token
      );

      const pages = Math.max(1, Math.ceil(data.count / 5));
      setTotalPage(pages);

      if (targetPage > pages) {
        setPage(pages);
        return;
      }

      setTransactionList(data.results);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchTransactions(page);
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

  const toggleFilter = () => {
    setIsFilterOpen((open) => !open);
  };

  const handleApply = (e) => {
    e.preventDefault();

    if (relatedIdFilter && typeFilter === "any") {
      alert("When using the Related ID filter, the type must be selected.");
      return;
    }

    if (amountFilter && operatorFilter === "any") {
      alert("When using the amount filter, you must select the operator.");
      return;
    }

    if (page !== 1) {
      setPage(1);
    } else {
      fetchTransactions(1);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    setTypeFilter("any");
    setPromotionIdFilter("");
    setRelatedIdFilter("");
    setAmountFilter("");
    setOperatorFilter("any");
    if (page !== 1) {
      setPage(1);
    } else {
      fetchTransactions(1);
    }
  };

  const formatNumber = (value) => (value === null || value === undefined ? "—" : Number(value).toLocaleString());

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

  const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

  return (
    <div className="page-shell your-transactions-page">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Fetching your most recent ledger entries.</p>
        </div>
      ) : (
        <>
          <header className="your-transactions-header" data-surface="flat">
            <div>
              <p className="eyebrow">Wallet · History</p>
              <h1 className="page-title">My Transactions</h1>
              <p className="page-subtitle">{user ? `Signed in as ${user.utorid}` : "Review every transaction tied to your account."}</p>
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
                <p>Try adjusting your filters or refresh to load the latest data.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table your-transactions-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Amount</th>
                      <th>Promotions / Notes</th>
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
                              {transaction.suspicious && <span className="table-chip is-danger">Flagged</span>}
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

export default YourTransactions;