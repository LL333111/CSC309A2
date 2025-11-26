import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllPromotions } from "../APIRequest";
import "./AllPromotions.css";

function AllPromotions() {
  const navigate = useNavigate();
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

      const data = await getAllPromotions(name, type, page, startedParam, endedParam, token, "false");
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
    <div className="all-promotions-container">
      {_loading ? (
        <div className="loading-container">
          <h2>Loading...</h2>
        </div>
      ) : (
        <div>
          <div className="page-header">
            <div>
              <h1 className="page-title">All Promotions</h1>
              <p className="page-subtitle">Browse all promotions. Filter by name, type, or status.</p>
            </div>
            <button className="create-promotion-btn" onClick={() => navigate('/new_promotion')}>
              Create New Promotion
            </button>
          </div>

          <button className="filter-toggle-btn" onClick={toggleFilter}>
            Filter {isFilterOpen ? '✕' : '☰'}
          </button>
          {isFilterOpen && (
            <section className="filter-panel">
              <div>
                <div>
                  <label htmlFor="name-filter">Name: </label>
                  <input
                    type="text"
                    id="name-filter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Input Promotion Name.."
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="type-filter">Type: </label>
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
                  <label htmlFor="status-filter">Status: </label>
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
                <button className="apply-btn" onClick={handleApply}>Apply</button>
                <button className="reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <div className="promotions-list">
            {promotionList.length === 0 ? (
              <div className="empty-state">
                <p>You do not have available promotions.</p>
              </div>
            ) : (
              promotionList.map((promotion) => {
                const status = getPromotionStatus(promotion);
                const statusClass = `status-badge status-${status.toLowerCase()}`;
                return (
                  <div key={promotion.id} className="promotion-card">
                    <div className="promotion-header">
                      <h3>{promotion.name}</h3>
                      <span className={statusClass}>
                        {status}
                      </span>
                    </div>

                    <div className="promotion-details">
                      <p><strong>Type: </strong>{promotion.type}</p>
                      <p><strong>Min Spending: </strong>{promotion.minSpending}</p>
                      <p><strong>Start Date: </strong>{formatDate(promotion.startTime)}</p>
                      <p><strong>End Date: </strong>{formatDate(promotion.endTime)}</p>
                      <p><strong>Rate: </strong>{promotion.rate}</p>
                      <p><strong>Points: </strong>{promotion.points}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {promotionList.length > 0 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={handlePrevious}
                disabled={page === 1}
              >
                Previous Page
              </button>
              <span className="pagination-info">
                Page {page} of {totalPage || 1}
              </span>
              <button
                className="pagination-btn"
                onClick={handleNext}
                disabled={page === totalPage}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}

export default AllPromotions;