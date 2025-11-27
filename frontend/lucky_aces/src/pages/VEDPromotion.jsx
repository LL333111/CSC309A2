import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useParams, useNavigate } from "react-router-dom"; // ISSUE FIX: Added useNavigate for redirect after delete
import { getPromotionById, updatePromotionById, deletePromotionById } from "../APIRequest";
import './VEDPromotion.css';


function VEDPromotion() {
    const [_loading, _setLoading] = useState(true);
    const { loading, token } = useLoggedInUser();
    const { promotionId } = useParams();
    const navigate = useNavigate(); // ISSUE FIX: Added navigate hook for redirect after delete
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [promotionData, setPromotionData] = useState({
        id: '',
        name: '',
        description: '',
        type: '',
        starttime: '',
        endtime: '',
        minSpending: '',
        rate: '',
        points: ''
    });

    // page protection
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
            setPromotionData(data);
        } catch (error) {
            console.error("Failed to fetch promotion:", error);
        }
    };

    const handleUpdatePromotion = async (e) => {
        e.preventDefault();
        setEditing(true);
        try {
            const data = await updatePromotionById(promotionId, promotionData, token);
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

            if (status === 200) {
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
                    {/* id, name, description, type, starttime, endtime, minSpending, rate, points */}
                    <form onSubmit={handleUpdatePromotion} className="promotion-form">
                        <h1>Edit Your Promotion</h1>
                        <div className="form-group">
                            <label htmlFor="idInput">ID: </label>
                            <input
                                id="idInput"
                                type="text"
                                value={promotionData.id}
                                onChange={(e) => setPromotionData({ ...promotionData, id: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nameInput">Name: </label>
                            <input
                                id="nameInput"
                                type="text"
                                value={promotionData.name}
                                onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="descriptionInput">Description: </label>
                            <input
                                id="descriptionInput"
                                type="text"
                                value={promotionData.description}
                                onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="typeInput">Type: </label>
                            <select
                                id="typeInput"
                                value={promotionData.type}
                                onChange={(e) => setPromotionData({ ...promotionData, type: e.target.value })}
                            >
                                <option value="automatic">Automatic</option>
                                <option value="one-time">One-time</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="starttimeInput">Start Time: </label>
                            <input
                                id="starttimeInput"
                                type="datetime-local"
                                value={promotionData.starttime}
                                onChange={(e) => setPromotionData({ ...promotionData, starttime: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endtimeInput">End Time: </label>
                            <input
                                id="endtimeInput"
                                type="datetime-local"
                                value={promotionData.endtime}
                                onChange={(e) => setPromotionData({ ...promotionData, endtime: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="minSpendingInput">Minimum Spending: </label>
                            <input
                                id="minSpendingInput"
                                type="number"
                                value={promotionData.minSpending}
                                onChange={(e) => setPromotionData({ ...promotionData, minSpending: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rateInput">Rate (%): </label>
                            <input
                                id="rateInput"
                                type="number"
                                value={promotionData.rate}
                                onChange={(e) => setPromotionData({ ...promotionData, rate: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="pointsInput">Points: </label>
                            <input
                                id="pointsInput"
                                type="number"
                                value={promotionData.points}
                                onChange={(e) => setPromotionData({ ...promotionData, points: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={editing}>
                            {editing ? "Updating..." : "Update Promotion"}
                        </button>
                    </form>

                    <button onClick={() => handleDeletePromotion(promotionData.id)} className="delete-btn" disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete Promotion"}
                    </button>
                </>
            )}
        </div>
    )
}

export default VEDPromotion;