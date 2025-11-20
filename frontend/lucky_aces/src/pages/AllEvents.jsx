import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllEvents } from "../APIRequest"

function AllEvents() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [eventList, setEventList] = useState([]);

  const [nameFilter, setNameFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFullFilter, setShowFullFilter] = useState("any");
  const [publishedFilter, setPublishedFilter] = useState("any");
  const [statusFilter, setStatusFilter] = useState("any");

  const { loading, token, role } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchEvents = async () => {
    try {
      let name = nameFilter || null;
      let location = locationFilter || null;
      let showFull = showFullFilter !== "any" ? showFullFilter : null;
      let published = publishedFilter !== "any" ? publishedFilter : null;
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

      const data = await getAllEvents(
        name,
        page,
        startedParam,
        endedParam,
        location,
        showFull,
        published,
        token
      );

      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }
      console.log(data);

      setEventList(data.results);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchEvents();
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
    setLocationFilter("");
    setShowFullFilter("any");
    setPublishedFilter("any");
    setStatusFilter("any");
    setPage(1);
    setTotalPage(null);
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

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
                    placeholder="Input Event Name.."
                  />
                </div>
                <div>
                  <label htmlFor="location-filter">Location: </label>
                  <input
                    type="text"
                    id="location-filter"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Input Event Location.."
                  />
                </div>
                <div>
                  <label htmlFor="showFull-filter">Show Full: </label>
                  <select
                    id="showFull-filter"
                    value={showFullFilter}
                    onChange={(e) => setShowFullFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="published-filter">Published: </label>
                  <select
                    id="published-filter"
                    value={publishedFilter}
                    onChange={(e) => setPublishedFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
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
            {eventList.length === 0 ? (
              <div>
                <p>You do not have available events.</p>
              </div>
            ) : (
              eventList.map((event) => (
                <div key={event.id}>
                  <div>
                    <h3>{event.name}</h3>
                    <span>
                      {getEventStatus(event)}
                    </span>
                  </div>

                  <div>
                    {/* 根据实际的事件数据结构调整显示字段 */}
                    <p><strong>Location: </strong>{event.location}</p>
                    <p><strong>Start Date: </strong>{formatDate(event.startTime)}</p>
                    <p><strong>End Date: </strong>{formatDate(event.endTime)}</p>
                    <p><strong>Capacity: </strong>{event.capacity || "no limit"}</p>
                    <p><strong>Number of Guests: </strong>{event.numGuests}</p>
                    {role >= 3 && <p><strong>Published: </strong>{event.published ? "True" : "False"}</p>}
                    {role >= 3 && <p><strong>Points Remain: </strong>{event.pointsRemain}</p>}
                    {role >= 3 && <p><strong>Points Awarded: </strong>{event.pointsAwarded}</p>}
                    <p><strong>Description: </strong>{event.description || 'N/A'}</p>
                    {/* 添加其他需要显示的事件字段 */}
                  </div>
                </div>
              ))
            )}
          </div>

          {eventList.length > 0 && (
            <div>
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
      )
      }
    </div >
  )
}

export default AllEvents;