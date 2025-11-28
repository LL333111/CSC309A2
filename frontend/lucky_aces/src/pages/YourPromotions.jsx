import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllPromotions } from "../APIRequest"
import "./AllPromotions.css";

function YourPromotions() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [promotionList, setPromotionList] = useState([]);

  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("any");

  const { loading, token } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchPromotions = async () => {
    try {
      let startedParam, endedParam;

      switch (statusFilter) {
        case "active":
          startedParam = "true";
          endedParam = "false";
          break;
        case "upcoming":
          startedParam = "false";
          endedParam = null;
          break;
        case "ended":
          startedParam = null;
          endedParam = "true";
          break;
        default:
          startedParam = null;
          endedParam = null;
      }
      let name = nameFilter || null;
      let type = typeFilter !== "any" ? typeFilter : null;

      const data = await getAllPromotions(name, type, page, startedParam, endedParam, token, "true");
      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }

      setPromotionList(data.results);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchPromotions();
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
    setPage(1);
    setTotalPage(null);
  }

  const handleReset = (e) => {
    e.preventDefault();
    setNameFilter("");
    setTypeFilter("any");
    setStatusFilter("any");
    setPage(1);
    setTotalPage(null);
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getPromotionStatus = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startTime);
    const endDate = new Date(promotion.endTime);

    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Ended';
    return 'Active';
  }

  return (
    <div className="page-shell promotions-page">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
        </div>
      ) : (
        <>
          <header className="promotions-header" data-surface="flat">
            <div>
              <p className="eyebrow">Engagement · Promotions</p>
              <h1 className="page-title">Your Promotions</h1>
              <p className="page-subtitle">Personalized offers you can currently redeem.</p>
            </div>
            <div className="promotions-header-actions header-actions">
              <button type="button" className="filter-toggle-btn" onClick={toggleFilter}>
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </header>

          {isFilterOpen && (
            <section className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="name-filter">Name</label>
                  <input
                    type="text"
                    id="name-filter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Search promotion name"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="type-filter">Type</label>
                  <select
                    id="type-filter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="status-filter">Status</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
              <div className="filter-actions">
                <button type="button" className="apply-btn" onClick={handleApply}>Apply</button>
                <button type="button" className="reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <section className="table-card" data-surface="flat">
            {promotionList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎁</div>
                <h3>No personal promotions</h3>
                <p>Once you earn offers, they will appear here.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table promotions-table">
                  <thead>
                    <tr>
                      <th>Promotion</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Min Spend</th>
                      <th>Reward</th>
                      <th>Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotionList.map((promotion) => {
                      const status = getPromotionStatus(promotion).toLowerCase();
                      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                      return (
                        <tr key={promotion.id}>
                          <td>
                            <div className="table-cell-primary">
                              <p className="table-title">{promotion.name}</p>
                              <p className="table-meta">#{promotion.id}</p>
                            </div>
                          </td>
                          <td>
                            <span className={`table-chip status-${status}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td>
                            <span className="table-chip is-muted">
                              {promotion.type}
                            </span>
                          </td>
                          <td>
                            {promotion.minSpending ?? "—"}
                          </td>
                          <td>
                            <div className="table-meta-stack">
                              <span>Rate: {promotion.rate ?? "—"}</span>
                              <span>Points: {promotion.points ?? "—"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-meta-stack">
                              <span>{formatDate(promotion.startTime)}</span>
                              <span className="table-meta">to {formatDate(promotion.endTime)}</span>
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

          {promotionList.length > 0 && (
            <section className="pagination" data-surface="flat">
              <button type="button" className="pagination-btn" onClick={handlePrevious} disabled={page === 1}>
                Previous Page
              </button>
              <span className="pagination-info">
                Page {page} of {totalPage || 1}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={handleNext}
                disabled={page === totalPage}
              >
                Next Page
              </button>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default YourPromotions;