import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { getNotifications } from "../APIRequest";
import "./Register.css";

function Notification() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [notificationList, setNotificationList] = useState([]);

  const { token, loading } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications(
        page,
        token
      );

      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }
      console.log(data);

      setNotificationList(data.results);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchNotifications();
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

  return (
    <div className="register-container" data-surface="flat">
      {_loading ? (
        <div className="loading">
          <h2>Loading...</h2>
        </div>
      ) : (
        <>
          <section className="notification-panel" data-surface="flat">
            <div className="notification-list">
              {notificationList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🎟️</div>
                  <h3>No notification found</h3>
                </div>
              ) : (
                notificationList.map((notification) => {

                  return (
                    <article className="notification-card" key={notification.id}>
                      <div className="notification-header">
                        <div>
                          <p className="notification-code">#{notification.id}</p>
                          <h3 className="notification-title">{notification.type}</h3>
                        </div>
                      </div>

                      <div className="notification-details">
                        <div className="notification-detail-item">
                          <strong>Message</strong>
                          <p>{notification.message}</p>
                        </div>
                        <div className="event-detail-item">
                          <strong>Created At</strong>
                          <p>{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {notificationList.length > 0 && (
            <section className="pagination" data-surface="flat">
              <button type="button" onClick={handlePrevious} disabled={page === 1}>
                Previous Page
              </button>
              <span>
                Page {page} of {totalPage || 1}
              </span>
              <button type="button" onClick={handleNext} disabled={page === totalPage}>
                Next Page
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Notification;