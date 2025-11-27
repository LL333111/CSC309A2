import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getOrganizerEvents } from "../APIRequest"

function OrganizerEvents() {
  const navigate = useNavigate();
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [eventList, setEventList] = useState([]);

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
      const data = await getOrganizerEvents(
        page,
        token,
      );

      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }

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
              <h1 className="page-title">Organizer Events</h1>
              <p className="page-subtitle">The events you are responsible for.</p>
            </div>
          </div>

          <div className="events-list">
            {eventList.length === 0 ? (
              <div className="no-events">
                <p>You are not responsible for any events.</p>
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
                    </div>
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

export default OrganizerEvents;