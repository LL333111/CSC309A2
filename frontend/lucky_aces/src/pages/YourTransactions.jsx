import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllTransactions } from "../APIRequest"
import "./YourTransactions.css"

function YourTransactions() {
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

  const { loading, token, user } = useLoggedInUser();

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
        user.utorid,
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

  return (
    <div className="all-transactions-container">
      {_loading ? (
        <div className="loading-container">
          <h2>Loading...</h2>
        </div>
      ) : (
        <div>
          <div className="page-header">
            <h1 className="page-title">Your Transactions</h1>
            <p className="page-subtitle">Browse all your past transaction. Filter by type, ID, or status.</p>
          </div>

          <button className="filter-toggle-btn" onClick={toggleFilter}>
            Filter {isFilterOpen ? '✕' : '☰'}
          </button>
          {isFilterOpen && (
            <section className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="type-filter">Type: </label>
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
                  <label htmlFor="createdBy-filter">Created By: </label>
                  <input
                    type="text"
                    id="createdBy-filter"
                    value={createdByFilter}
                    onChange={(e) => setCreatedByFilter(e.target.value)}
                    placeholder="UTORID.."
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="suspicious-filter">Suspicious: </label>
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
                  <label htmlFor="promotionId-filter">Promotion ID: </label>
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
                  <label htmlFor="relatedId-filter">Related ID: </label>
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
                    <small>
                      When using the Related ID filter, the type must be selected.
                    </small>
                  )}
                </div>
                <div className="filter-group">
                  <label htmlFor="operator-filter">Amount Operator: </label>
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
                  <label htmlFor="amount-filter">Amount: </label>
                  <input
                    type="number"
                    id="amount-filter"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    placeholder="Amount"
                    step="0.01"
                  />
                  {amountFilter && operatorFilter === "any" && (
                    <small>
                      When using the amount filter, you must select the operator.
                    </small>
                  )}
                </div>
              </div>
              <div className="filter-actions">
                <button className="apply-btn" onClick={handleApply}>Apply</button>
                <button className="reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <div className="transactions-list">
            {transactionList.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions found.</p>
              </div>
            ) : (
              transactionList.map((transaction) => (
                <div
                  className="transaction-card"
                  data-type={transaction.type}
                  key={transaction.id}
                >
                  <div className="transaction-header">
                    <h3>Transaction ID: {transaction.id}</h3>
                  </div>
                  <div className="transaction-details">
                    {transaction.type === "purchase" && (
                      <>
                        <p><strong>Type: </strong>{transaction.type}</p>
                        <p><strong>User: </strong>{transaction.utorid}</p>
                        <p><strong>Spent: </strong>{transaction.spent}</p>
                        <p><strong>Amount: </strong>{transaction.amount}</p>
                        <p><strong>Used Promotion: </strong>{transaction.promotionIds.length === 0 ? "No Promotion" : transaction.promotionIds.map(object => object.id).join(', ')}</p>
                        <p><strong>Remark: </strong>{transaction.remark}</p>
                        <p><strong>Created By: </strong>{transaction.createdBy}</p>
                      </>
                    )}

                    {transaction.type === "adjustment" && (
                      <>
                        <p><strong>Type: </strong>{transaction.type}</p>
                        <p><strong>User: </strong>{transaction.utorid}</p>
                        <p><strong>Amount: </strong>{transaction.amount}</p>
                        <p><strong>Used Promotion: </strong>{transaction.promotionIds.length === 0 ? "No Promotion" : transaction.promotionIds.map(object => object.id).join(', ')}</p>
                        <p><strong>Related Transaction: </strong>{transaction.relatedId}</p>
                        <p><strong>Remark: </strong>{transaction.remark}</p>
                        <p><strong>Created By: </strong>{transaction.createdBy}</p>
                      </>
                    )}

                    {transaction.type === "transfer" && (
                      <>
                        <p><strong>Type: </strong>{transaction.type}</p>
                        <p><strong>Amount: </strong>{transaction.sent}</p>
                        <p><strong>Sender: </strong>{transaction.sender}</p>
                        <p><strong>Recipient: </strong>{transaction.recipient}</p>
                        <p><strong>Remark: </strong>{transaction.remark}</p>
                      </>
                    )}

                    {transaction.type === "redemption" && (
                      <>
                        <p><strong>Type: </strong>{transaction.type}</p>
                        <p><strong>User: </strong>{transaction.utorid}</p>
                        <p><strong>Redeemed: </strong>{transaction.redeemed}</p>
                        <p><strong>Remark: </strong>{transaction.remark}</p>
                        <p><strong>Created By: </strong>{transaction.createdBy}</p>
                        <p><strong>Processed By: </strong>{transaction.relatedId === null ? "Unprocessed" : transaction.relatedId}</p>
                      </>
                    )}

                    {transaction.type === "event" && (
                      <>
                        <p><strong>Type: </strong>{transaction.type}</p>
                        <p><strong>Amount: </strong>{transaction.awarded}</p>
                        <p><strong>Recipient: </strong>{transaction.recipient}</p>
                        <p><strong>Sender Event: </strong>{transaction.relatedId}</p>
                        <p><strong>Remark: </strong>{transaction.remark}</p>
                        <p><strong>Created By: </strong>{transaction.createdBy}</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {transactionList.length > 0 && (
            <div className="pagination">
              <button
                onClick={handlePrevious}
                disabled={page === 1}
              >
                Previous Page
              </button>
              <span>
                Page {page} of {totalPage || 1}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPage}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default YourTransactions;