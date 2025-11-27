import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useParams, useNavigate } from "react-router-dom"; // ISSUE FIX: Added useNavigate for redirect after delete
import { getEventById, updateEventById, deleteEventById } from "../APIRequest";
import './VEDEvent.css';


function VEDEvent() {
    const [_loading, _setLoading] = useState(true);
    const { loading, token } = useLoggedInUser();
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    // Treat pointsRemain as points for editing purposes
    const [eventData, setEventData] = useState({
        id: '',
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        capacity: 0,
        pointsRemain: 0,
        pointsAwarded: 0,
        published: false,
        organizers: [],
        guests: [],
        points: 0,
    });

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

    const fetchEvent = async (eventId) => {
        try {
            const data = await getEventById(eventId, token);
            console.log(data);

            // Convert backend datetime format (ISO 8601) to datetime-local format (YYYY-MM-DDTHH:mm)
            const startTimeFormatted = data.startTime ? data.startTime.slice(0, 16) : '';
            const endTimeFormatted = data.endTime ? data.endTime.slice(0, 16) : '';

            // Convert capacity: null means unlimited, empty string for input field
            const capacityFormatted = data.capacity === null ? '' : data.capacity;
            const formattedData = {
                ...data,
                startTime: startTimeFormatted,
                endTime: endTimeFormatted,
                capacity: capacityFormatted,
            };

            setEventData({ ...formattedData, points: data.points });
        } catch (error) {
            console.error("Failed to fetch event:", error);
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        setEditing(true);
        try {
            const updateFields = {};

            // Only include fields that are editable per API spec
            if (eventData.name !== undefined && eventData.name !== '') {
                updateFields.name = eventData.name;
            }
            if (eventData.description !== undefined && eventData.description !== '') {
                updateFields.description = eventData.description;
            }
            if (eventData.location !== undefined && eventData.location !== '') {
                updateFields.location = eventData.location;
            }

            // Convert datetime-local to ISO 8601 format with microseconds
            if (eventData.startTime) {
                const startDate = new Date(eventData.startTime);
                updateFields.startTime = startDate.toISOString().replace('Z', '.000000+00:00');
            }
            if (eventData.endTime) {
                const endDate = new Date(eventData.endTime);
                updateFields.endTime = endDate.toISOString().replace('Z', '.000000+00:00');
            }

            // Capacity: number or null
            if (eventData.capacity !== undefined) {
                if (eventData.capacity === '' || eventData.capacity === null) {
                    updateFields.capacity = null;
                } else {
                    updateFields.capacity = parseInt(eventData.capacity);
                }
            }

            // Points , Not points remained or awarded
            if (eventData.points !== undefined && eventData.points !== '') {
                updateFields.points = parseInt(eventData.points);
            }

            // Published: boolean
            if (eventData.published !== undefined) {
                updateFields.published = eventData.published;
            }

            console.log('Sending update:', updateFields);
            const data = await updateEventById(eventId, updateFields, token);

            if (data) {
                alert("Event updated successfully!");
                fetchEvent(eventId);
            } else {
                alert("Failed to update event.");
            }
        } catch (error) {
            console.error("Error updating event:", error);
            alert("Error updating event.");
        } finally {
            setEditing(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) {
            return;
        }
        setDeleting(true);
        try {
            const status = await deleteEventById(eventId, token);

            if (status === 204) {
                alert("Event deleted successfully!");
                navigate('/all_events');
            } else {
                alert("Failed to delete event.");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Error deleting event.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="ved-event-container">
            {_loading ? (
                <div>
                    <h2>Loading...</h2>
                </div>
            ) : (
                <>
                    <form onSubmit={handleUpdateEvent} className="event-form">
                        <h1>View Your Event</h1>

                        <div className="form-group">
                            <label>Event ID: </label>
                            <span className="readonly-field">{eventData.id}</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="nameInput">Name: </label>
                            <input
                                id="nameInput"
                                type="text"
                                value={eventData.name || ''}
                                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="descriptionInput">Description: </label>
                            <textarea
                                id="descriptionInput"
                                value={eventData.description || ''}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="locationInput">Location: </label>
                            <input
                                id="locationInput"
                                type="text"
                                value={eventData.location || ''}
                                onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="startTimeInput">Start Time: </label>
                            <input
                                id="startTimeInput"
                                type="datetime-local"
                                value={eventData.startTime || ''}
                                onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endTimeInput">End Time: </label>
                            <input
                                id="endTimeInput"
                                type="datetime-local"
                                value={eventData.endTime || ''}
                                onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="publishedInput">Published: </label>
                            <select
                                id="publishedInput"
                                value={eventData.published}
                                onChange={(e) => setEventData({ ...eventData, published: e.target.value === 'true' })}
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="capacityInput">Capacity: </label>
                            <input
                                id="capacityInput"
                                type="number"
                                value={eventData.capacity || ''}
                                onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
                                placeholder="Leave empty for unlimited"
                            />
                        </div>

                        {/* View-only organizers */}
                        {eventData.organizers && (
                            <div className="form-group">
                                <label>Organizers: </label>
                                <div className="organizers-list">
                                    {eventData.organizers.length > 0 ? (
                                        eventData.organizers.map(org => (
                                            <span key={org.id} className="organizer-badge">
                                                {org.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="readonly-field">None</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View-only guests */}
                        {eventData.guests && (
                            <div className="form-group">
                                <label>Guests: </label>
                                <div className="guests-list">
                                    {eventData.guests.length > 0 ? (
                                        eventData.guests.map(guest => (
                                            <span key={guest.id} className="guest-badge">
                                                {guest.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="readonly-field">None</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View-only: Points Awarded */}
                        {eventData.pointsAwarded !== undefined && (
                            <div className="form-group">
                                <label>Points Awarded: </label>
                                <span className="readonly-field">{eventData.pointsAwarded}</span>
                            </div>
                        )}

                        {/* View-only: Points Remain */}
                        {eventData.pointsRemain !== undefined && (
                            <div className="form-group">
                                <label>Points Remain: </label>
                                <span className="readonly-field">{eventData.pointsRemain}</span>
                            </div>
                        )}

                        {/* Edit Points */}
                        <div className="form-group">
                            <label htmlFor="pointsInput">Points: </label>
                            <input
                                id="pointsInput"
                                type="number"
                                value={eventData.points || ''}
                                onChange={(e) => setEventData({ ...eventData, points: e.target.value })}
                                placeholder="Points for organizers to distribute"
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={editing}>
                            {editing ? "Updating..." : "Update Event"}
                        </button>
                    </form>

                    <button onClick={() => handleDeleteEvent(eventData.id)} className="delete-btn" disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete Event"}
                    </button>
                </>
            )}
        </div>
    )
}

export default VEDEvent;
