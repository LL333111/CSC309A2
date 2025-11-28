import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getOrganizerEvents } from "../APIRequest"
import "./OrganizerEvents.css";

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

  const formatSchedule = (event) => {
    return (
      <div className="table-meta-stack">
        <span>{formatDate(event.startTime)}</span>
        <span className="table-meta">Ends {formatDate(event.endTime)}</span>
      </div>
    );
  };

  const showAdminMetrics = role >= 3;

  return (
    <div className="page-shell events-page">
      {_loading ? (
        <div className="loading-container" data-surface="flat">
          <h2>Loading...</h2>
          <p>Collecting your events.</p>
        </div>
      ) : (
        <>
          <header className="events-header" data-surface="flat">
            <div>
              <p className="eyebrow">Events · Organizer</p>
              <h1 className="page-title">Organizer Events</h1>
              <p className="page-subtitle">Review upcoming and active events you manage.</p>
            </div>
          </header>

          <section className="table-card" data-surface="flat">
            {eventList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h3>No assigned events</h3>
                <p>Events you own will appear here once scheduled.</p>
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
                      <button onClick={() => navigate(`/edit_events_users/${event.id}`)}>Edit Event Users</button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {eventList.length > 0 && (
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

export default OrganizerEvents;