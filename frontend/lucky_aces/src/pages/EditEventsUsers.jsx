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
    return (
      <div className="container">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container">
        <h2>Please log in to access this page</h2>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <h2>Event not found</h2>
      </div>
    );
  }

  // Check if user has any permissions
  if (!hasOrganizerPermissions() && !hasManagerPermissions()) {
    return (
      <div className="container">
        <h2>Access Denied</h2>
        <p>You don't have permission to manage this event.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="title">Manage Event: {event.name}</h2>

      {/* Event Details */}
      <div className="eventDetails">
        <h3 className="sectionTitle">Event Details</h3>
        <div className="detailsGrid">
          <div className="detailItem">
            <label className="detailLabel">Description:</label>
            <span className="detailValue">{event.description || "No description"}</span>
          </div>
          <div className="detailItem">
            <label className="detailLabel">Location:</label>
            <span className="detailValue">{event.location || "No location specified"}</span>
          </div>
          <div className="detailItem">
            <label className="detailLabel">Start Time:</label>
            <span className="detailValue">{formatDateTime(event.startTime)}</span>
          </div>
          <div className="detailItem">
            <label className="detailLabel">End Time:</label>
            <span className="detailValue">{formatDateTime(event.endTime)}</span>
          </div>
        </div>
      </div>

      {/* Event Status Info */}
      <div className="eventStatus">
        <h4 className="subtitle">Event Status</h4>
        <ul className="statusList">
          <li className="statusItem">Published: {isEventPublished() ? "Yes" : "No"}</li>
          <li className="statusItem">Started: {isEventStarted() ? "Yes" : "No"}</li>
          <li className="statusItem">Ended: {isEventEnded() ? "Yes" : "No"}</li>
          <li className="statusItem">
            Capacity: {event.numGuests || 0}
            {event.capacity ? ` / ${event.capacity}` : " (No limit)"}
            {isEventFull() && " - FULL"}
          </li>
        </ul>
      </div>

      {/* Guest Management Section - Visible to both organizer and manager/superuser */}
      <div className="section">
        <h3 className="sectionTitle">Guest Management</h3>
        <div className="inputGroup">
          <input
            type="text"
            placeholder="Enter UTORid to add as guest"
            value={guestUtoridInput}
            onChange={(e) => setGuestUtoridInput(e.target.value)}
            className="input"
            disabled={!canAddGuest()}
          />
          <button
            onClick={handleAddGuest}
            className="btn btnPrimary"
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
        <h4 className="subtitle">Current Guests ({event.numGuests || 0})</h4>
        {event.guests && event.guests.length > 0 ? (
          <div className="list">
            {event.guests.map(guest => (
              <div key={guest.id} className="listItem">
                <span className="listText">{guest.utorid} - {guest.name || guest.email}</span>
                {/* Only manager/superuser can remove guests */}
                {hasManagerPermissions() && (
                  <button
                    onClick={() => handleRemoveGuest(guest.id, guest.utorid)}
                    className="btn btnDanger btnSmall"
                    disabled={isEventEnded()}
                    title={isEventEnded() ? "Event has ended" : "Remove guest"}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No guests registered for this event.</p>
        )}
      </div>
      {/* Organizer Management Section - Only visible to manager/superuser */}
      {hasManagerPermissions() && (
        <div className="section">
          <h3 className="sectionTitle">Organizer Management</h3>
          <div className="inputGroup">
            <input
              type="text"
              placeholder="Enter UTORid to add as organizer"
              value={organizerUtoridInput}
              onChange={(e) => setOrganizerUtoridInput(e.target.value)}
              className="input"
              disabled={!canAddOrganizer()}
            />
            <button
              onClick={handleAddOrganizer}
              className="btn btnPrimary"
              disabled={!canAddOrganizer()}
              title={!canAddOrganizer() ? "Event has ended" : "Add organizer"}
            >
              Add Organizer
            </button>
          </div>

          <h4 className="subtitle">Current Organizers ({event.organizers ? event.organizers.length : 0})</h4>
          {event.organizers && event.organizers.length > 0 ? (
            <div className="list">
              {event.organizers.map(organizer => (
                <div key={organizer.id} className="listItem">
                  <span className="listText">{organizer.utorid} - {organizer.name || organizer.email}</span>
                  <button
                    onClick={() => handleRemoveOrganizer(organizer.id, organizer.utorid)}
                    className="btn btnDanger btnSmall"
                    disabled={isEventEnded()}
                    title={isEventEnded() ? "Event has ended" : "Remove organizer"}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No organizers assigned to this event.</p>
          )}
        </div>
      )}

      {/* Permission Info */}
      <div className="permissions">
        <h4 className="subtitle">Your Permissions</h4>
        <ul className="permissionsList">
          {hasOrganizerPermissions() && (
            <>
              <li className={`permissionItem ${canAddGuest() ? "allowed" : "disallowed"}`}>
                {canAddGuest() ? "✓" : "✗"} Add guests to this event
                {!canAddGuest() && (
                  <span className="reason">
                    {!isEventPublished() ? " (Event not published)" :
                      isEventEnded() ? " (Event ended)" :
                        isEventFull() ? " (Event full)" : ""}
                  </span>
                )}
              </li>
              <li className="permissionItem disallowed">✗ Cannot remove guests</li>
              <li className="permissionItem disallowed">✗ Cannot manage organizers</li>
            </>
          )}
          {hasManagerPermissions() && (
            <>
              <li className={`permissionItem ${canAddGuest() ? "allowed" : "disallowed"}`}>
                {canAddGuest() ? "✓" : "✗"} Add guests to this event
                {!canAddGuest() && (
                  <span className="reason">
                    {!isEventPublished() ? " (Event not published)" :
                      isEventEnded() ? " (Event ended)" :
                        isEventFull() ? " (Event full)" : ""}
                  </span>
                )}
              </li>
              <li className={`permissionItem ${!isEventEnded() ? "allowed" : "disallowed"}`}>
                {!isEventEnded() ? "✓" : "✗"} Remove guests from this event
                {isEventEnded() && <span className="reason"> (Event ended)</span>}
              </li>
              <li className={`permissionItem ${canAddOrganizer() ? "allowed" : "disallowed"}`}>
                {canAddOrganizer() ? "✓" : "✗"} Add organizers to this event
                {!canAddOrganizer() && <span className="reason"> (Event ended)</span>}
              </li>
              <li className={`permissionItem ${!isEventEnded() ? "allowed" : "disallowed"}`}>
                {!isEventEnded() ? "✓" : "✗"} Remove organizers from this event
                {isEventEnded() && <span className="reason"> (Event ended)</span>}
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

export default EditEventsUsers;