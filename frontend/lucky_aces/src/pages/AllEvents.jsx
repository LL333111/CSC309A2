import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllEvents } from "../APIRequest"
import "./AllEvents.css"

function AllEvents() {
  const navigate = useNavigate();
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
    fetchEvents();
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
    fetchEvents();
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  }

  return (
    <div className="all-events-container">
      {_loading ? (
        <div className="loading-container">
          <h2>Loading...</h2>
        </div>
      ) : (
        <div>
          <div className="page-header">
            <div>
              <h1 className="page-title">All Events</h1>
              <p className="page-subtitle">Browse all events. Filter by name, location, or status.</p>
            </div>
            <button className="create-event-btn" onClick={() => navigate('/new_event')}>
              Create New Event
            </button>
          </div>

          <button className="filter-toggle-btn" onClick={toggleFilter}>
            Filter {isFilterOpen ? '✕' : '☰'}
          </button>
          {isFilterOpen && (
            <section className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="name-filter">Name: </label>
                  <input
                    type="text"
                    id="name-filter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Input Event Name.."
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="location-filter">Location: </label>
                  <input
                    type="text"
                    id="location-filter"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Input Event Location.."
                  />
                </div>
                <div className="filter-group">
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
                <div className="filter-group">
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
                {role >= 3 && (
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
                )}
              </div>
              <div className="filter-actions">
                <button className="apply-btn" onClick={handleApply}>Apply</button>
                <button className="reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </section>
          )}

          <div className="events-list">
            {eventList.length === 0 ? (
              <div className="no-events">
                <p>You do not have available events.</p>
              </div>
            ) : (
              eventList.map((event) => {
                const status = getEventStatus(event);

                return (
                  <div className={`event-card`} key={event.id}>
                    <div className="event-header">
                      <h3 className="event-title">{event.name}</h3>
                      <span className={`event-status status-${status}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>

                    <div className="event-details">
                      <div className="event-detail-item">
                        <strong>Location:</strong>
                        <p>{event.location}</p>
                      </div>
                      <div className="event-detail-item">
                        <strong>Start Date:</strong>
                        <p>{formatDate(event.startTime)}</p>
                      </div>
                      <div className="event-detail-item">
                        <strong>End Date:</strong>
                        <p>{formatDate(event.endTime)}</p>
                      </div>
                      <div className="event-detail-item">
                        <strong>Capacity:</strong>
                        <div className="capacity-info">
                          <span>{event.numGuests} / {event.capacity || "∞"}</span>
                        </div>
                      </div>
                      <div className="event-detail-item">
                        <strong>Description:</strong>
                        <p>{event.description || 'N/A'}</p>
                      </div>

                      {role >= 3 && (
                        <div className="admin-info">
                          <div className="event-detail-item">
                            <strong>Published:</strong>
                            <p>{event.published ? "True" : "False"}</p>
                          </div>
                          <div className="event-detail-item">
                            <strong>Points Remain:</strong>
                            <p>{event.pointsRemain}</p>
                          </div>
                          <div className="event-detail-item">
                            <strong>Points Awarded:</strong>
                            <p>{event.pointsAwarded}</p>
                          </div>
                        </div>
                      )}
                      {status !== "upcoming" && <div>
                        <button onClick={() => navigate(`/reward_points/${event.id}`)}>Reward Points</button>
                      </div>}
                    </div>
                    <button onClick={() => navigate(`/edit_events_users/${event.id}`)}>Edit Event Users</button>
                    <button
                      className="ved-btn"
                      onClick={() => navigate(`/ved_event/${event.id}`)}
                    >
                      View/Edit/Delete
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {eventList.length > 0 && (
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

export default AllEvents;