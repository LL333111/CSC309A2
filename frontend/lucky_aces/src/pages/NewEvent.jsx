import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../APIRequest';
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import './NewEvent.css';

const NewEvent = () => {
    const navigate = useNavigate();
    const { loading, token, role } = useLoggedInUser();
    const [_loading, _setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        capacity: '',
        points: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            _setLoading(loading);
        }, 500);
        return () => clearTimeout(timer);
    }, [loading]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submitting) return;

        // Validate points
        const pointsNum = parseInt(formData.points);

        if (pointsNum <= 0) {
            alert("Points must be greater than 0");
            return;
        }

        if (!formData.startTime || !formData.endTime) {
            alert("Start time and end time are required");
            return;
        }

        // Capacity is optional - null means unlimited
        const capacityNum = formData.capacity ? parseInt(formData.capacity) : null;

        const startISO = `${formData.startTime}:00.000000+00:00`;
        const endISO = `${formData.endTime}:00.000000+00:00`;

        const startDate = new Date(formData.startTime);
        const endDate = new Date(formData.endTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            alert("Please provide valid start and end timestamps");
            return;
        }

        if (startDate >= endDate) {
            alert("End time must be after start time");
            return;
        }

        // Validate that start time is in the future
        const now = new Date();
        if (startDate <= now) {
            alert("Event start time must be in the future");
            return;
        }

        console.log("Creating event with data:", {
            name: formData.name,
            description: formData.description,
            location: formData.location,
            startTime: startISO,
            endTime: endISO,
            capacity: capacityNum,
            points: pointsNum
        });

        setSubmitting(true);

        try {
            const status = await createEvent(
                formData.name,
                formData.description,
                formData.location,
                startISO,
                endISO,
                capacityNum,
                pointsNum,
                token
            );

            if (status === 201) {
                alert('Event created successfully!');
                navigate('/all_events');
            } else {
                alert(`Failed to create event. Status: ${status}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    if (_loading) {
        return (
            <div className="new-event-container">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (role < 3) {
        return (
            <div className="new-event-container">
                <div className="error-message">
                    <h2>Access Denied</h2>
                    <p>You must be a Manager or higher to create events.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="new-event-container">
            <h1>Create New Event</h1>
            <form onSubmit={handleSubmit} className="event-form">
                <div className="form-group">
                    <label htmlFor="name">Event Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Enter event name here...'
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder='Enter event description here...'
                        rows="4"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        placeholder='Enter event location here...'
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="startTime">Start Time</label>
                        <input
                            type="datetime-local"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endTime">End Time</label>
                        <input
                            type="datetime-local"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="capacity">Capacity (optional)</label>
                        <input
                            type="number"
                            id="capacity"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            placeholder="Enter capacity here... If no input, assumed unlimited."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="points">Points Reward </label>
                        <input
                            type="number"
                            id="points"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            min="1"
                            placeholder="Enter points here..."
                            required
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Event'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => navigate('/all_events')} disabled={submitting}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewEvent;