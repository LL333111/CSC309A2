import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { addOrganizer, removeOrganizer, addGuest, removeGuest, getEventById } from "../APIRequest";
import "./EditEventsUsers.css";

function EditEventsUsers() {
  const { eventId } = useParams();
  const [_loading, _setLoading] = useState(true);
  const [guestUtoridInput, setGuestUtoridInput] = useState("");
  const [organizerUtoridInput, setOrganizerUtoridInput] = useState("");
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refresh, setRefresh] = useState(false);

  const { token, loading, role, user: loggedInUser } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  // 获取事件数据的函数
  const fetchEventData = async () => {
    if (token && eventId) {
      try {
        const eventData = await getEventById(eventId, token);
        setEvent(eventData);
      } catch (err) {
        setError("Failed to fetch event details");
      }
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchEventData();
    }
  }, [eventId, token, _loading, refresh]);

  // 使用原生alert显示消息
  useEffect(() => {
    if (error) {
      alert(`Error: ${error}`);
      setError(""); // 显示后清除错误
    }
    if (success) {
      alert(`Success: ${success}`);
      setSuccess(""); // 显示后清除成功消息
    }
  }, [error, success]);

  const isOrganizer = () => {
    if (!event || !loggedInUser) return false;
    return event.organizers.some(organizer => organizer.id === loggedInUser.id);
  };

  const isManagerOrSuperuser = () => {
    return role === 3 || role === 4;
  };

  const hasOrganizerPermissions = () => {
    return isOrganizer() && role < 3;
  };

  const hasManagerPermissions = () => {
    return isManagerOrSuperuser();
  };

  const isEventPublished = () => {
    return event && event.published;
  };

  const isEventEnded = () => {
    if (!event || !event.endTime) return false;
    return new Date() > new Date(event.endTime);
  };

  const isEventStarted = () => {
    if (!event || !event.startTime) return false;
    return new Date() > new Date(event.startTime);
  };

  const isEventFull = () => {
    return event && event.capacity && event.numGuests >= event.capacity;
  };

  const canAddGuest = () => {
    return isEventPublished() && !isEventEnded() && !isEventFull();
  };

  const canAddOrganizer = () => {
    return !isEventEnded();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const renderStateCard = (title, message) => (
    <div className="page-shell manage-event-page">
      <section className="state-card" data-surface="flat">
        <h2>{title}</h2>
        {message && <p>{message}</p>}
      </section>
    </div>
  );

  const handleAddGuest = async () => {
    if (!guestUtoridInput.trim()) {
      setError("Please enter a UTORid");
      return;
    }

    if (!canAddGuest()) {
      if (!isEventPublished()) {
        setError("Cannot add guest: Event is not published");
      } else if (isEventEnded()) {
        setError("Cannot add guest: Event has ended");
      } else if (isEventFull()) {
        setError("Cannot add guest: Event is full");
      }
      return;
    }
    const response = await addGuest(guestUtoridInput, eventId, token);
    switch (response) {
      case 400:
        setError("Invalid UTORid or event ID format, or user is already a guest");
        break;
      case 404:
        setError("User not found, event not found, or event is not published");
        break;
      case 410:
        setError("Event has ended or is full");
        break;
      case 201:
        setSuccess(`Successfully added ${guestUtoridInput} as guest`);
        setGuestUtoridInput("");
        break;
      default:
        setError(`Failed to add guest`);
    }
    setRefresh(!refresh);
  };

  const handleRemoveGuest = async (userId, utorid) => {
    const response = await removeGuest(eventId, userId, token);
    switch (response) {
      case 400:
        setError("Invalid UTORid or event ID format, or user is not a guest");
        break;
      case 404:
        setError("User not found or event not found");
        break;
      case 204:
        setSuccess(`Successfully removed guest ${utorid}`);
        break;
      default:
        setError(`Failed to remove guest`);
    }
    setRefresh(!refresh);
  };

  const handleAddOrganizer = async () => {
    if (!organizerUtoridInput.trim()) {
      setError("Please enter a UTORid");
      return;
    }

    if (!canAddOrganizer()) {
      setError("Cannot add organizer: Event has ended");
      return;
    }

    const response = await addOrganizer(organizerUtoridInput, eventId, token);
    switch (response) {
      case 400:
        setError("Invalid UTORid or event ID format, or user is already an organizer");
        break;
      case 404:
        setError("User not found or event not found");
        break;
      case 410:
        setError("Event has ended");
        break;
      case 201:
        setSuccess(`Successfully added ${organizerUtoridInput} as organizer`);
        setOrganizerUtoridInput("");
        break;
      default:
        setError(`Failed to add organizer`);
    }
    setRefresh(!refresh);
  };

  const handleRemoveOrganizer = async (userId, utorid) => {
    const response = await removeOrganizer(eventId, userId, token);
    switch (response) {
      case 400:
        setError("Invalid UTORid or event ID format, or user is not an organizer");
        break;
      case 404:
        setError("User not found or event not found");
        break;
      case 204:
        setSuccess(`Successfully removed organizer ${utorid}`);
        break;
      default:
        setError(`Failed to remove organizer`);
    }
    setRefresh(!refresh);
  };

  if (_loading) {
    return renderStateCard("Loading...", "Please wait while we fetch event details.");
  }

  if (!token) {
    return renderStateCard("Please log in to access this page", "");
  }

  if (!event) {
    return renderStateCard("Event not found", "Double-check the link and try again.");
  }

  if (!hasOrganizerPermissions() && !hasManagerPermissions()) {
    return renderStateCard("Access Denied", "You don't have permission to manage this event.");
  }

  return (
    <div className="page-shell manage-event-page">
      <header className="manage-event-hero" data-surface="flat">
        <div className="hero-text">
          <p className="eyebrow">Management · Events</p>
          <h1 className="page-title">{event.name}</h1>
          <p className="page-subtitle">Add or remove organizers and guests for this event.</p>
        </div>
        <div className="hero-meta">
          <div className="hero-meta-item">
            <span>Event ID</span>
            <strong>#{event.id}</strong>
          </div>
          <div className="hero-meta-item">
            <span>Capacity</span>
            <strong>
              {event.numGuests || 0}
              {event.capacity ? ` / ${event.capacity}` : " · No limit"}
            </strong>
          </div>
          <div className="hero-meta-item">
            <span>Published</span>
            <strong>{isEventPublished() ? "Yes" : "No"}</strong>
          </div>
        </div>
      </header>

      <section className="event-overview-card">
        <div className="detail-grid">
          <div className="detail-card">
            <span className="detail-label">Description</span>
            <p className="detail-value">{event.description || "No description"}</p>
          </div>
          <div className="detail-card">
            <span className="detail-label">Location</span>
            <p className="detail-value">{event.location || "No location specified"}</p>
          </div>
          <div className="detail-card">
            <span className="detail-label">Start Time</span>
            <p className="detail-value">{formatDateTime(event.startTime)}</p>
          </div>
          <div className="detail-card">
            <span className="detail-label">End Time</span>
            <p className="detail-value">{formatDateTime(event.endTime)}</p>
          </div>
        </div>
        <div className="status-panel">
          <h4>Event Status</h4>
          <ul className="status-list">
            <li className="status-item">Published: {isEventPublished() ? "Yes" : "No"}</li>
            <li className="status-item">Started: {isEventStarted() ? "Yes" : "No"}</li>
            <li className="status-item">Ended: {isEventEnded() ? "Yes" : "No"}</li>
            <li className="status-item">
              Capacity: {event.numGuests || 0}
              {event.capacity ? ` / ${event.capacity}` : " (No limit)"}
              {isEventFull() && " · Full"}
            </li>
          </ul>
        </div>
      </section>

      <section className="management-card">
        <div className="section-heading">
          <div>
            <h3>Guest Management</h3>
            <p>Invite or remove attendees. Guests can only be added to published events.</p>
          </div>
          <span className="badge badge-blue">
            Guests · {event.numGuests || 0}
            {event.capacity ? ` / ${event.capacity}` : ""}
          </span>
        </div>
        <div className="management-inputs">
          <input
            type="text"
            placeholder="Enter UTORid to add as guest"
            value={guestUtoridInput}
            onChange={(e) => setGuestUtoridInput(e.target.value)}
            disabled={!canAddGuest()}
          />
          <button
            type="button"
            onClick={handleAddGuest}
            className="btn-primary"
            disabled={!canAddGuest()}
            title={!canAddGuest() ?
              (!isEventPublished() ? "Event is not published" :
                isEventEnded() ? "Event has ended" :
                  isEventFull() ? "Event is full" : "Cannot add guest") :
              "Add guest"}
          >
            Add Guest
          </button>
        </div>
        <h4 className="list-title">Current Guests</h4>
        {event.guests && event.guests.length > 0 ? (
          <div className="entity-list">
            {event.guests.map(guest => (
              <div key={guest.id} className="entity-list-item">
                <div className="entity-meta">
                  <span className="entity-name">{guest.name || guest.email || guest.utorid}</span>
                  <span className="entity-id">{guest.utorid}</span>
                </div>
                {hasManagerPermissions() && (
                  <div className="entity-actions">
                    <button
                      type="button"
                      onClick={() => handleRemoveGuest(guest.id, guest.utorid)}
                      className="btn-danger btn-compact"
                      disabled={isEventEnded()}
                      title={isEventEnded() ? "Event has ended" : "Remove guest"}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state-text">No guests registered for this event.</p>
        )}
      </section>

      {hasManagerPermissions() && (
        <section className="management-card">
          <div className="section-heading">
            <div>
              <h3>Organizer Management</h3>
              <p>Only managers and superusers can manage organizers.</p>
            </div>
            <span className="badge badge-green">
              Organizers · {event.organizers ? event.organizers.length : 0}
            </span>
          </div>
          <div className="management-inputs">
            <input
              type="text"
              placeholder="Enter UTORid to add as organizer"
              value={organizerUtoridInput}
              onChange={(e) => setOrganizerUtoridInput(e.target.value)}
              disabled={!canAddOrganizer()}
            />
            <button
              type="button"
              onClick={handleAddOrganizer}
              className="btn-primary"
              disabled={!canAddOrganizer()}
              title={!canAddOrganizer() ? "Event has ended" : "Add organizer"}
            >
              Add Organizer
            </button>
          </div>

          <h4 className="list-title">Current Organizers</h4>
          {event.organizers && event.organizers.length > 0 ? (
            <div className="entity-list">
              {event.organizers.map(organizer => (
                <div key={organizer.id} className="entity-list-item">
                  <div className="entity-meta">
                    <span className="entity-name">{organizer.name || organizer.email || organizer.utorid}</span>
                    <span className="entity-id">{organizer.utorid}</span>
                  </div>
                  <div className="entity-actions">
                    <button
                      type="button"
                      onClick={() => handleRemoveOrganizer(organizer.id, organizer.utorid)}
                      className="btn-danger btn-compact"
                      disabled={isEventEnded()}
                      title={isEventEnded() ? "Event has ended" : "Remove organizer"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state-text">No organizers assigned to this event.</p>
          )}
        </section>
      )}

      <section className="permissions-card">
        <h3>Your Permissions</h3>
        <ul className="permissions-list">
          {hasOrganizerPermissions() && role < 3 && (
            <>
              <li className={`permission-line ${canAddGuest() ? "allowed" : "denied"}`}>
                <span className="status-chip">{canAddGuest() ? "✓" : "✗"}</span>
                <div>
                  <p>Add guests to this event</p>
                  {!canAddGuest() && (
                    <p className="reason-text">
                      {!isEventPublished() ? "Event is not published." :
                        isEventEnded() ? "Event has ended." :
                          isEventFull() ? "Event is full." : ""}
                    </p>
                  )}
                </div>
              </li>
              <li className="permission-line denied">
                <span className="status-chip">✗</span>
                <div>
                  <p>Remove guests from this event</p>
                  <p className="reason-text">Requires manager or superuser access.</p>
                </div>
              </li>
              <li className="permission-line denied">
                <span className="status-chip">✗</span>
                <div>
                  <p>Manage event organizers</p>
                  <p className="reason-text">Only managers and superusers can manage organizers.</p>
                </div>
              </li>
            </>
          )}

          {hasManagerPermissions() && (
            <>
              <li className={`permission-line ${canAddGuest() ? "allowed" : "denied"}`}>
                <span className="status-chip">{canAddGuest() ? "✓" : "✗"}</span>
                <div>
                  <p>Add guests to this event</p>
                  {!canAddGuest() && (
                    <p className="reason-text">
                      {!isEventPublished() ? "Event is not published." :
                        isEventEnded() ? "Event has ended." :
                          isEventFull() ? "Event is full." : ""}
                    </p>
                  )}
                </div>
              </li>
              <li className={`permission-line ${!isEventEnded() ? "allowed" : "denied"}`}>
                <span className="status-chip">{!isEventEnded() ? "✓" : "✗"}</span>
                <div>
                  <p>Remove guests from this event</p>
                  {isEventEnded() && <p className="reason-text">Event has ended.</p>}
                </div>
              </li>
              <li className={`permission-line ${canAddOrganizer() ? "allowed" : "denied"}`}>
                <span className="status-chip">{canAddOrganizer() ? "✓" : "✗"}</span>
                <div>
                  <p>Add organizers to this event</p>
                  {!canAddOrganizer() && <p className="reason-text">Event has ended.</p>}
                </div>
              </li>
              <li className={`permission-line ${!isEventEnded() ? "allowed" : "denied"}`}>
                <span className="status-chip">{!isEventEnded() ? "✓" : "✗"}</span>
                <div>
                  <p>Remove organizers from this event</p>
                  {isEventEnded() && <p className="reason-text">Event has ended.</p>}
                </div>
              </li>
            </>
          )}
        </ul>
      </section>
    </div>
  );
}

export default EditEventsUsers;