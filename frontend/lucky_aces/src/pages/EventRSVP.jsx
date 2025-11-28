import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById, rsvpToEvent, cancelRsvpToEvent } from "../APIRequest";
import './EventRSVP.css';

function EventRSVP() {
    const [_loading, _setLoading] = useState(true);
    const { loading, token, user, update, setUpdate } = useLoggedInUser();
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [eventData, setEventData] = useState(null);
    const [isAttending, setIsAttending] = useState(false);
    const [isOrganizer, setIsOrganizer] = useState(false);

    // page protection
    useEffect(() => {
        const timer = setTimeout(() => {
            _setLoading(loading);
        }, 500);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        if (!_loading && token && eventId) {
            fetchEvent(eventId);
        }
    }, [_loading, token, eventId]);

    useEffect(() => {
        if (eventData && user.guestsEvent) {
            const attending = user.guestsEvent.some(event => event.id === eventData.id);
            setIsAttending(attending);
            const organizer = user.organizersEvent.some(event => event.id === eventData.id);
            setIsOrganizer(organizer);
        }
    }, [user, eventData]);

    const fetchEvent = async (eventId) => {
        try {
            const data = await getEventById(eventId, token);
            console.log(data);
            setEventData(data);

            // Check if current user is in the guests list
            const attending = user.guestsEvent.some(event => event.id === data.id) || user.organizersEvent.some(event => event.id === data.id);
            setIsAttending(attending);
            const organizer = user.organizersEvent.some(event => event.id === eventData.id);
            setIsOrganizer(organizer);
        } catch (error) {
            console.error("Failed to fetch event:", error);
        }
    };

    const handleRSVP = async () => {
        if (!window.confirm("Confirm RSVP to this event?")) {
            return;
        }
        setActionLoading(true);
        try {
            const result = await rsvpToEvent(eventId, token);

            if (result && result.id) {
                alert("Successfully RSVP'd to the event!");
                setIsAttending(true);
                setUpdate(!update);
                await fetchEvent(eventId); // Refresh event data
            } else if (result === 400) {
                alert("Event is full or you're already attending");
            } else if (result === 410) {
                alert("Event has already ended");
            } else {
                alert("Failed to RSVP to event");
            }
        } catch (error) {
            console.error("Failed to RSVP:", error);
            alert("Failed to RSVP to event");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRSVP = async () => {
        if (!window.confirm("Cancel your RSVP to this event?")) {
            return;
        }
        setActionLoading(true);
        try {
            const status = await cancelRsvpToEvent(eventId, token);

            if (status === 204) {
                alert("Successfully cancelled RSVP");
                setIsAttending(false);
                setUpdate(!update);
                await fetchEvent(eventId); // Refresh event data
            } else if (status === 410) {
                alert("Event has already ended");
            } else {
                alert("Failed to cancel RSVP");
            }
        } catch (error) {
            console.error("Failed to cancel RSVP:", error);
            alert("Failed to cancel RSVP");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventStatus = () => {
        if (!eventData) return 'unknown';
        const now = new Date();
        const startDate = new Date(eventData.startTime);
        const endDate = new Date(eventData.endTime);

        if (now < startDate) return 'upcoming';
        if (now > endDate) return 'ended';
        return 'active';
    };

    const isEventFull = () => {
        if (!eventData) return false;
        if (eventData.capacity === null) return false;
        return eventData.numGuests >= eventData.capacity;
    };

    const canRSVP = () => {
        const status = getEventStatus();
        return status !== 'ended' && !isEventFull() && !isAttending && !isOrganizer;
    };

    const canCancelRSVP = () => {
        const status = getEventStatus();
        return status !== 'ended' && isAttending && !isOrganizer;
    };

    return (
        <div className="event-rsvp-container" data-surface="flat">
            {_loading ? (
                <div className="loading-container">
                    <h2>Loading...</h2>
                </div>
            ) : !eventData ? (
                <div className="error-container">
                    <h2>Event Not Found</h2>
                    <button className="back-btn" onClick={() => navigate('/published_events')}>
                        Back to Events
                    </button>
                </div>
            ) : (
                <>
                    <div className="event-detail-card">
                        <div className="event-header">
                            <div>
                                <p className="eyebrow">Events · RSVP</p>
                                <h1 className="page-title">{eventData.name}</h1>
                            </div>
                            <span className={`status-badge status-${getEventStatus()}`}>
                                {getEventStatus().toUpperCase()}
                            </span>
                        </div>

                        <div className="event-info-grid">
                            {/* Fields from GET /events/:eventId for regular users */}

                            <div className="info-item">
                                <strong>Location:</strong>
                                <p>{eventData.location}</p>
                            </div>

                            <div className="info-item">
                                <strong>Start Date:</strong>
                                <p>{formatDate(eventData.startTime)}</p>
                            </div>

                            <div className="info-item">
                                <strong>End Date:</strong>
                                <p>{formatDate(eventData.endTime)}</p>
                            </div>

                            <div className="info-item">
                                <strong>Capacity:</strong>
                                <p>
                                    {eventData.numGuests !== undefined ? eventData.numGuests : 'N/A'} / {eventData.capacity || "Unlimited"}
                                    {isEventFull() && <span className="full-badge"> (FULL)</span>}
                                </p>
                            </div>

                            <div className="info-item full-width">
                                <strong>Description:</strong>
                                <p>{eventData.description || 'No description provided'}</p>
                            </div>

                            {/* Organizers - always returned by GET endpoint */}
                            {eventData.organizers && (
                                <div className="info-item full-width">
                                    <strong>Organizers:</strong>
                                    <div className="organizers-list">
                                        {eventData.organizers.length > 0 ? (
                                            eventData.organizers.map(org => (
                                                <span key={org.id} className="organizer-badge">
                                                    {org.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span>None</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="action-buttons">
                            {canRSVP() && (
                                <button
                                    className="rsvp-btn"
                                    onClick={handleRSVP}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Processing..." : "RSVP to Event"}
                                </button>
                            )}

                            {canCancelRSVP() && (
                                <button
                                    className="cancel-rsvp-btn"
                                    onClick={handleCancelRSVP}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Processing..." : "Cancel RSVP"}
                                </button>
                            )}

                            {getEventStatus() === 'ended' && (
                                <div className="ended-notice">
                                    This event has ended
                                </div>
                            )}

                            {isEventFull() && !isAttending && getEventStatus() !== 'ended' && (
                                <div className="full-notice">
                                    This event is full
                                </div>
                            )}

                            {isOrganizer && (
                                <div className="full-notice">
                                    You are an organizer of this event
                                </div>
                            )}
                        </div>

                        <button className="back-btn" onClick={() => navigate('/published_events')}>
                            Back to Events
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default EventRSVP;
