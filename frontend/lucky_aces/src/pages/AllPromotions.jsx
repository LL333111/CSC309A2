import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllPromotions } from "../APIRequest"
import { QRCodeSVG } from 'qrcode.react';

function AllPromotions() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [promotionList, setPromotionList] = useState([]);

  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("any");

  const { loading, token, role } = useLoggedInUser();

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
          endedParam = "false";
          break;
        case "ended":
          startedParam = "true";
          endedParam = "true";
          break;
        default:
          startedParam = null;
          endedParam = null;
      }
      let name = nameFilter || null;
      let type = typeFilter !== "any" ? typeFilter : null;

      const data = await getAllPromotions(name, type, page, startedParam, endedParam, token);
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
  }, [page, _loading]);

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
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Ended';
    return 'Active';
  }

  return (
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <button onClick={toggleFilter}>
            Filter {isFilterOpen ? '✕' : '☰'}
          </button>
          {isFilterOpen && (
            <section>
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
                <div>
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
                {role >= 3 && <div>
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
                </div>}
              </div>
              <div>
                <button onClick={handleApply}>Apply</button>
                <button onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <div>
            {promotionList.length === 0 ? (
              <div>
                <p>You do not have available promotions.</p>
              </div>
            ) : (
              promotionList.map((promotion) => (
                <div key={promotion.id}>
                  <div>
                    <h3>{promotion.name}</h3>
                    <span>
                      {getPromotionStatus(promotion)}
                    </span>
                  </div>

                  <div >
                    <p><strong>Type: </strong>{promotion.type}</p>
                    <p><strong>Min Spemdomh: </strong>{promotion.minSpending}</p>
                    <p><strong>End Date: </strong>{formatDate(promotion.endTime)}</p>
                    <p><strong>Rate: </strong>{promotion.rate}</p>
                    <p><strong>Points: </strong>{promotion.points}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {promotionList.length > 0 && (
            <div >
              <button
                onClick={handlePrevious}
                disabled={page === 1}
              >
                Previous Page
              </button>
              <span >
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
      )
      }
    </div >
  )
}

export default AllPromotions;