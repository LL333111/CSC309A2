import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPromotion } from '../APIRequest';
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import './NewPromotions.css';

const NewPromotions = () => {
    const navigate = useNavigate();
    const { loading, token, role } = useLoggedInUser();
    const [_loading, _setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'automatic',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        minSpending: '',
        rate: '',
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

        // Optional: Validate rate and points if provided
        const rateNum = formData.rate ? parseFloat(formData.rate) : null;
        const pointsNum = formData.points ? parseInt(formData.points) : null;

        if (rateNum !== null && rateNum <= 0) {
            alert("Rate must be greater than 0");
            return;
        }

        if (pointsNum !== null && pointsNum <= 0) {
            alert("Points must be greater than 0");
            return;
        } 1

        // Validate minSpending if provided
        const minSpendingNum = formData.minSpending ? parseFloat(formData.minSpending) : null;
        if (minSpendingNum !== null && minSpendingNum <= 0) {
            alert("Minimum spending must be greater than 0");
            return;
        }

        // Combine date and time into the format backend expects
        const startDateTime = `${formData.startDate}T${formData.startTime}:00.000000+00:00`;
        const endDateTime = `${formData.endDate}T${formData.endTime}:00.000000+00:00`;

        // Validate that start time is in the future
        const now = new Date();
        const startDate = new Date(startDateTime);
        if (startDate <= now) {
            alert("Promotion start time must be in the future");
            return;
        }

        // Validate that end time is after start time
        const endDate = new Date(endDateTime);
        if (endDate <= startDate) {
            alert("End time must be after start time");
            return;
        }

        console.log("Creating promotion with data:", {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            startTime: startDateTime,
            endTime: endDateTime,
            minSpending: minSpendingNum,
            rate: rateNum,
            points: pointsNum
        });

        setSubmitting(true);

        try {
            const status = await createPromotion(
                formData.name,
                formData.description,
                formData.type,
                startDateTime,
                endDateTime,
                minSpendingNum,
                rateNum,
                pointsNum,
                token
            );

            if (status === 201) {
                alert('Promotion created successfully!');
                navigate('/all_promotions');
            } else {
                alert(`Failed to create promotion. Status: ${status}`);
            }
        } catch (error) {
            console.error('Error creating promotion:', error);
            alert('Failed to create promotion');
        } finally {
            setSubmitting(false);
        }
    };

    if (_loading) {
        return (
            <div className="new-promotion-container">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (role < 3) {
        return (
            <div className="new-promotion-container">
                <div className="error-message">
                    <h2>Access Denied</h2>
                    <p>You must be a Manager or higher to create promotions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="new-promotion-container">
            <h1>Create New Promotion</h1>
            <form onSubmit={handleSubmit} className="promotion-form">
                <div className="form-group">
                    <label htmlFor="name">Promotion Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Enter promotion name here...'
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder='Enter promotion description here...'
                        rows="4"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="type">Type *</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="automatic">Automatic</option>
                        <option value="one-time">One-time</option>
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="startDate">Start Date *</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="startTime">Start Time *</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="endDate">End Date *</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endTime">End Time *</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="minSpending">Minimum Spending (optional)</label>
                    <input
                        type="number"
                        id="minSpending"
                        name="minSpending"
                        value={formData.minSpending}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="e.g., 50.00"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="rate">Rate (optional)</label>
                        <input
                            type="number"
                            id="rate"
                            name="rate"
                            value={formData.rate}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            placeholder="e.g., 0.05 for 5%"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="points">Points (optional)</label>
                        <input
                            type="number"
                            id="points"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            min="1"
                            placeholder="e.g., 100"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Promotion'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => navigate('/all_promotions')} disabled={submitting}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewPromotions;
