import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useParams, useNavigate } from "react-router-dom";
import { getPromotionById, updatePromotionById, deletePromotionById } from "../APIRequest";
import './VEDPromotion.css';

function VEDPromotion() {
    const [_loading, _setLoading] = useState(true);
    const { loading, token } = useLoggedInUser();
    const { promotionId } = useParams();
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
        const startTime = promotionData.startTime ? new Date(promotionData.startTime) : null;

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

    const [promotionData, setPromotionData] = useState({
        id: '',
        name: '',
        description: '',
        type: '',
        startTime: '',
        endTime: '',
        minSpending: 0,
        rate: 0,
        points: 0
    });

    const [copyPromotionData, setCopyPromotionData] = useState({
        id: '',
        name: '',
        description: '',
        type: '',
        startTime: '',
        endTime: '',
        minSpending: 0,
        rate: 0,
        points: 0
    });

    // Page protection
    useEffect(() => {
        const timer = setTimeout(() => {
            _setLoading(loading);
        }, 500);
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        if (!_loading && token && promotionId) {
            fetchPromotion(promotionId);
        }
    }, [_loading, token, promotionId]);

    const fetchPromotion = async (promotionId) => {
        try {
            const data = await getPromotionById(promotionId, token);
            console.log(data);

            // Convert backend datetime format (ISO 8601) to datetime-local format (YYYY-MM-DDTHH:mm)
            const startTimeFormatted = data.startTime ? data.startTime.slice(0, 16) : '';
            const endTimeFormatted = data.endTime ? data.endTime.slice(0, 16) : '';

            const formattedData = {
                ...data,
                startTime: startTimeFormatted,
                endTime: endTimeFormatted,
            };

            setPromotionData(formattedData);
            setCopyPromotionData(formattedData);
        } catch (error) {
            console.error("Failed to fetch promotion:", error);
        }
    };

    const handleUpdatePromotion = async (e) => {
        e.preventDefault();
        setEditing(true);
        try {
            const updateFields = {};

            // Only include fields that are editable per API spec
            if (promotionData.name !== undefined && promotionData.name !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.name = null;
                } else {
                    updateFields.name = promotionData.name;
                }
            }
            if (promotionData.description !== undefined && promotionData.description !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.description = null;
                } else {
                    updateFields.description = promotionData.description;
                }
            }
            if (promotionData.type !== undefined && promotionData.type !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.type = null;
                } else {
                    updateFields.type = promotionData.type;
                }
            }

            // Convert datetime-local to ISO 8601 format - use new conversion function to avoid timezone issues
            if (promotionData.startTime) {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.startTime = null;
                } else {
                    updateFields.startTime = localToISOString(promotionData.startTime);
                }
            }
            if (promotionData.endTime) {
                updateFields.endTime = localToISOString(promotionData.endTime);
            }

            // Numeric fields: convert to proper types
            if (promotionData.minSpending !== undefined && promotionData.minSpending !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.minSpending = null;
                } else {
                    updateFields.minSpending = parseFloat(promotionData.minSpending);
                }
            }
            if (promotionData.rate !== undefined && promotionData.rate !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.rate = null;
                } else {
                    updateFields.rate = parseFloat(promotionData.rate);
                }
            }
            if (promotionData.points !== undefined && promotionData.points !== '') {
                if (new Date() >= new Date(copyPromotionData.startTime)) {
                    updateFields.points = null;
                } else {
                    updateFields.points = parseInt(promotionData.points);
                }
            }

            // Remove all fields with null values
            Object.keys(updateFields).forEach(key => {
                if (updateFields[key] === null) {
                    delete updateFields[key];
                }
            });

            console.log('Sending update:', updateFields);
            const data = await updatePromotionById(promotionId, updateFields, token);
            if (data) {
                alert("Promotion updated successfully!");
                fetchPromotion(promotionId);
            } else {
                alert("Failed to update promotion.");
            }
        } catch (error) {
            console.error("Error updating promotion:", error);
            alert("Error updating promotion.");
        } finally {
            setEditing(false);
        }
    };

    const handleDeletePromotion = async (promotionId) => {
        if (!window.confirm("Are you sure you want to delete this promotion?")) {
            return;
        }
        setDeleting(true);
        try {
            const status = await deletePromotionById(promotionId, token);
            if (status === 204) {
                alert("Promotion deleted successfully!");
                navigate('/all_promotions');
            } else {
                alert("Failed to delete promotion.");
            }
        } catch (error) {
            console.error("Error deleting promotion:", error);
            alert("Error deleting promotion.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="ved-promotion-container">
            {_loading ? (
                <div>
                    <h2>Loading...</h2>
                </div>
            ) : (
                <>
                    <form onSubmit={handleUpdatePromotion} className="promotion-form">
                        <h1>Edit Your Promotion</h1>

                        {/* View-only field: id (in GET, not in PATCH) */}
                        <div className="form-group">
                            <label>Promotion ID: </label>
                            <span className="readonly-field">{promotionData.id}</span>
                        </div>

                        {/* Editable name if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="nameInput">Name: </label>
                                <input
                                    id="nameInput"
                                    type="text"
                                    value={promotionData.name || ''}
                                    onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
                                />
                            </div>
                        )}
                        {/* View-only name if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="nameInput">Name: </label>
                                <span className="readonly-field">{promotionData.name || ''}</span>
                            </div>
                        )}

                        {/* Editable description if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="descriptionInput">Description: </label>
                                <textarea
                                    id="descriptionInput"
                                    value={promotionData.description || ''}
                                    onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                        )}
                        {/* View-only description if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="descriptionInput">Description: </label>
                                <span className="readonly-field">{promotionData.description || ''}</span>
                            </div>
                        )}

                        {/* Editable type if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="typeInput">Type: </label>
                                <select
                                    id="typeInput"
                                    value={promotionData.type || 'automatic'}
                                    onChange={(e) => setPromotionData({ ...promotionData, type: e.target.value })}
                                >
                                    <option value="automatic">Automatic</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>
                        )}
                        {/* View-only type if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="typeInput">Type: </label>
                                <span className="readonly-field">{promotionData.type || ''}</span>
                            </div>
                        )}

                        {/* Editable start time if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="startTimeInput">Start Time: </label>
                                <input
                                    id="startTimeInput"
                                    type="datetime-local"
                                    value={promotionData.startTime || ''}
                                    min={getCurrentDateTimeLocal()}
                                    onChange={(e) => setPromotionData({ ...promotionData, startTime: e.target.value })}
                                />
                            </div>
                        )}
                        {/* Not editable start time if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="startTimeInput">Start Time: </label>
                                <span className="readonly-field">{promotionData.startTime}</span>
                            </div>
                        )}

                        {/* Editable end time only if current time is before end time */}
                        {new Date() < new Date(copyPromotionData.endTime) && (
                            <div className="form-group">
                                <label htmlFor="endTimeInput">End Time: </label>
                                <input
                                    id="endTimeInput"
                                    type="datetime-local"
                                    value={promotionData.endTime || ''}
                                    min={getMinEndTime()}
                                    onChange={(e) => setPromotionData({ ...promotionData, endTime: e.target.value })}
                                />
                            </div>
                        )}
                        {/* Not editable end time if current time is after end time */}
                        {new Date() >= new Date(copyPromotionData.endTime) && (
                            <div className="form-group">
                                <label htmlFor="endTimeInput">End Time: </label>
                                <span className="readonly-field">{promotionData.endTime}</span>
                            </div>
                        )}

                        {/* Editable minSpending if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="minSpendingInput">Minimum Spending: </label>
                                <input
                                    id="minSpendingInput"
                                    type="number"
                                    step="0.01"
                                    value={promotionData.minSpending || ''}
                                    onChange={(e) => setPromotionData({ ...promotionData, minSpending: e.target.value })}
                                    placeholder="Minimum purchase amount"
                                />
                            </div>
                        )}
                        {/* View-only minSpending if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="minSpendingInput">Minimum Spending: </label>
                                <span className="readonly-field">{promotionData.minSpending || ''}</span>
                            </div>
                        )}

                        {/* Editable rate if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="rateInput">Rate: </label>
                                <input
                                    id="rateInput"
                                    type="number"
                                    step="0.01"
                                    value={promotionData.rate || ''}
                                    onChange={(e) => setPromotionData({ ...promotionData, rate: e.target.value })}
                                    placeholder="Promotional rate (e.g., 0.01 = 1%)"
                                />
                            </div>
                        )}
                        {/* View-only rate if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="rateInput">Rate: </label>
                                <span className="readonly-field">{promotionData.rate || ''}</span>
                            </div>
                        )}

                        {/* Editable points if current time is before start time */}
                        {new Date() < new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="pointsInput">Points: </label>
                                <input
                                    id="pointsInput"
                                    type="number"
                                    value={promotionData.points || ''}
                                    onChange={(e) => setPromotionData({ ...promotionData, points: e.target.value })}
                                    placeholder="Promotional points to add"
                                />
                            </div>
                        )}
                        {/* View-only points if current time is after start time */}
                        {new Date() >= new Date(copyPromotionData.startTime) && (
                            <div className="form-group">
                                <label htmlFor="pointsInput">Points: </label>
                                <span className="readonly-field">{promotionData.points || ''}</span>
                            </div>
                        )}

                        {new Date(copyPromotionData.endTime) < new Date() ?
                            <strong>The promotion has already ended and cannot be changed.</strong> :
                            <button type="submit" className="submit-btn" disabled={editing}>
                                {editing ? "Updating..." : "Update Promotion"}
                            </button>}
                    </form>

                    {new Date(copyPromotionData.startTime) > new Date() && <button onClick={() => handleDeletePromotion(promotionData.id)} className="delete-btn" disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete Promotion"}
                    </button>}
                </>
            )}
        </div>
    )
}

export default VEDPromotion;