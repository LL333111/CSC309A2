import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById, updateEventById, deleteEventById } from "../APIRequest";
import './VEDEvent.css';

function VEDEvent() {
    const [_loading, _setLoading] = useState(true);
    const { loading, token } = useLoggedInUser();
    const { eventId } = useParams();
    const [deletePublished, setDeletePublished] = useState(false);
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Get current datetime in datetime-local format for min attribute
    const getCurrentDateTimeLocal = () => {
        return new Date().toISOString().slice(0, 16);
    };

    // Get minimum end time: maximum of current time and start time
    const getMinEndTime = () => {
        const now = new Date();
        const startTime = eventData.startTime ? new Date(eventData.startTime) : null;

        // If startTime is not set, use current time
        if (!startTime) {
            return now.toISOString().slice(0, 16);
        }

        // Return the later of current time and startTime
        return now > startTime ? now.toISOString().slice(0, 16) : startTime.toISOString().slice(0, 16);
    };

    // Convert local time to backend required format (without timezone information)
    const localToISOString = (localDateTimeString) => {
        if (!localDateTimeString) return '';

        // Create a new Date object, parse local time string as local time
        const localDate = new Date(localDateTimeString);

        // Manually build ISO string to avoid timezone conversion
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = String(localDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

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

    const [copyEventData, setCopyEventData] = useState({
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

    // Page protection
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
            setDeletePublished(data.published);
            setEventData({ ...formattedData, points: data.points });
            setCopyEventData({ ...formattedData, points: data.points });
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
                if (new Date(eventData.startTime) < new Date()) {
                    updateFields.name = null; // No change to name
                } else {
                    updateFields.name = eventData.name;
                }
            }
            if (eventData.description !== undefined && eventData.description !== '') {
                if (new Date(eventData.startTime) < new Date()) {
                    updateFields.description = null; // No change to description
                } else {
                    updateFields.description = eventData.description;
                }
            }
            if (eventData.location !== undefined && eventData.location !== '') {
                if (new Date(eventData.startTime) < new Date()) {
                    updateFields.location = null; // No change to location
                } else {
                    updateFields.location = eventData.location;
                }
            }
            // Convert datetime-local to ISO 8601 format - use new conversion function to avoid timezone issues
            if (eventData.startTime) {
                if (new Date() < new Date(eventData.startTime)) {
                    updateFields.startTime = localToISOString(eventData.startTime);
                } else {
                    updateFields.startTime = null; // No change to start time
                }
            }
            if (eventData.endTime) {
                if (new Date(eventData.endTime) > new Date()) {
                    updateFields.endTime = localToISOString(eventData.endTime);
                } else {
                    updateFields.endTime = null; // No change to end time
                }
            }

            // Capacity: number or null
            if (eventData.capacity !== undefined) {
                if (new Date() < new Date(eventData.startTime)) {
                    if (eventData.capacity === '' || eventData.capacity === null) {
                        updateFields.capacity = null;
                    } else {
                        updateFields.capacity = parseInt(eventData.capacity);
                    }
                } else {
                    updateFields.capacity = null; // No change to capacity
                }
            }

            // Points , Not points remained or awarded
            if (eventData.points !== undefined && eventData.points !== '') {
                updateFields.points = parseInt(eventData.points) === 0 ? null : parseInt(eventData.points);
            }

            // Published: boolean
            if (eventData.published !== undefined) {
                updateFields.published = eventData.published ? true : null;
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
                        {/* Editable name if current time is before start time */}
                        {new Date() < new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="nameInput">Name: </label>
                                <input
                                    id="nameInput"
                                    type="text"
                                    value={eventData.name || ''}
                                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                                />
                            </div>
                        )}
                        {/* View-only name if current time is after start time */}
                        {new Date() >= new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="nameInput">Name: </label>
                                <span className="readonly-field">{eventData.name || ''}</span>
                            </div>
                        )}
                        {/* Editable description if current time is before start time */}
                        {new Date() < new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="descriptionInput">Description: </label>
                                <textarea
                                    id="descriptionInput"
                                    value={eventData.description || ''}
                                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                        )}
                        {/* View-only description if current time is after start time */}
                        {new Date() >= new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="descriptionInput">Description: </label>
                                <span className="readonly-field">{eventData.description || ''}</span>
                            </div>
                        )}
                        {/* Editable location if current time is before start time */}
                        {new Date() < new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="locationInput">Location: </label>
                                <input
                                    id="locationInput"
                                    type="text"
                                    value={eventData.location || ''}
                                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                                />
                            </div>
                        )}
                        {/* View-only location if current time is after start time */}
                        {new Date() >= new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="locationInput">Location: </label>
                                <span className="readonly-field">{eventData.location || ''}</span>
                            </div>
                        )}

                        {/* Editable capacity if current time is before start time */}
                        {new Date() < new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="capacityInput">Capacity: </label>
                                <input
                                    id="capacityInput"
                                    type="number"
                                    value={eventData.capacity || ''}
                                    onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
                                />
                            </div>
                        )}

                        {/* View-only capacity if current time is after start time */}
                        {new Date() >= new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="capacityInput">Capacity: </label>
                                <span className="readonly-field">{eventData.capacity === null || eventData.capacity === '' ? 'Unlimited' : eventData.capacity}</span>
                            </div>
                        )}

                        {/* Editable start time if current time is before start time */}
                        {new Date() < new Date(copyEventData.startTime) && (

                            <div className="form-group">
                                <label htmlFor="startTimeInput">Start Time: </label>
                                <input
                                    id="startTimeInput"
                                    type="datetime-local"
                                    value={eventData.startTime || ''}
                                    min={getCurrentDateTimeLocal()}
                                    onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Not editable start time if current time is after start time */}
                        {new Date() >= new Date(copyEventData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="startTimeInput">Start Time: </label>
                                <span className="readonly-field">{eventData.startTime}</span>
                            </div>
                        )}

                        {/* Editable end time only if current time is before end time */}
                        {new Date() < new Date(copyEventData.endTime) && (
                            <div className="form-group">
                                <label htmlFor="endTimeInput">End Time: </label>
                                <input
                                    id="endTimeInput"
                                    type="datetime-local"
                                    value={eventData.endTime || ''}
                                    min={getMinEndTime()}
                                    onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Not editable end time if current time is after end time */}
                        {new Date() >= new Date(copyEventData.endTime) && (
                            <div className="form-group">
                                <label htmlFor="endTimeInput">End Time: </label>
                                <span className="readonly-field">{eventData.endTime}</span>
                            </div>
                        )}

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

                        {/* Always editable Points */}
                        <div className="form-group">
                            <label htmlFor="pointsInput">Points: </label>
                            <input
                                id="pointsInput"
                                type="number"
                                value={eventData.points || ''}
                                min={1}
                                step={1}
                                onChange={(e) => setEventData({ ...eventData, points: e.target.value })}
                                placeholder="Points for organizers to distribute"
                            />
                        </div>

                        {deletePublished ?
                            <div className="form-group">
                                <label>Published: </label>
                                <span className="readonly-field">True</span>
                            </div> :
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
                            </div>}

                        <button type="submit" className="submit-btn" disabled={editing}>
                            {editing ? "Updating..." : "Update Event"}
                        </button>
                    </form>
                    {!deletePublished && (
                        <button onClick={() => handleDeleteEvent(eventData.id)} className="delete-btn" disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Event"}
                        </button>
                    )}

                </>
            )}
        </div>
    )
}

export default VEDEvent;