import { useState, useEffect } from 'react';
import { getUserById } from '../APIRequest';
import { updateUserById } from '../APIRequest';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import "./UpdateUser.css";

function UpdateUser() {
    const [_loading, _setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const { loading, token, role } = useLoggedInUser();
    const { userId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            _setLoading(loading);
        }, 500);
        return () => clearTimeout(timer);
    }, [loading]);

    const fetchUser = async () => {
        try {
            const data = await getUserById(userId, token);
            console.log(data);
            setUserData(data);
        } catch (error) {
            console.error("Failed to fetch the specific user:", error);
        }
    }

    // Fetch user data when component mounts
    useEffect(() => {
        if (!_loading && token) {
            fetchUser();
        }
    }, [_loading, token, userId]);

    // Handler for updating user - can be reused for all actions
    const handleUpdateUser = async (updateFields) => {
        setActionLoading(true);
        try {
            const data = await updateUserById(userId, updateFields, token);
            // Refetch user data to ensure UI is in sync
            await fetchUser();
            alert('User updated successfully!');
        } catch (error) {
            console.error("Failed to update user:", error);
            alert("Failed to update user");
        } finally {
            setActionLoading(false);
        }
    }

    // Specific action handlers for manager or superuser
    const handleVerifyUser = () => {
        handleUpdateUser({ verified: true });
    }

    const handlePromoteToCashier = () => {
        if (window.confirm(`Promote ${userData.name} to Cashier?`)) {
            handleUpdateUser({ role: "cashier" });
        }
    }

    const handleMarkSuspicious = () => {
        handleUpdateUser({ suspicious: true });
    }

    const handleClearSuspicious = () => {
        handleUpdateUser({ suspicious: false });
    }

    const handleRevokeCashier = () => {
        if (window.confirm(`Revoke cashier status for ${userData.name}?`)) {
            handleUpdateUser({ role: "regular" });
        }
    }

    // Specific action handlers only for superuser
    const handlePromoteToManager = () => {
        if (window.confirm(`Promote ${userData.name} to Manager?`)) {
            handleUpdateUser({ role: "manager" });
        }
    }

    const handlePromoteToSuperuser = () => {
        if (window.confirm(`Promote ${userData.name} to Superuser?`)) {
            handleUpdateUser({ role: "superuser" });
        }
    }

    const handleRevokeManager = () => {
        if (window.confirm(`Revoke manager status for ${userData.name}?`)) {
            handleUpdateUser({ role: "cashier" });
        }
    }

    // 3 is manager, 4 is superuser
    return (
        <div className="update-user-container">
            <h2>Update User</h2>
            {_loading || !userData ? (
                <div className="loading-container">
                    <p>Loading user data...</p>
                </div>
            ) : (
                <>
                    {/* User Information Card */}
                    <div className="user-info-card">
                        <h3>User Information</h3>
                        <p><strong>User ID:</strong> {userId}</p>
                        <p><strong>Name:</strong> {userData.name}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Role:</strong> {userData.role}</p>
                        <p><strong>Points:</strong> {userData.points}</p>
                        <p><strong>Verified:</strong> {userData.verified ? "Yes" : "No"}</p>
                        <p><strong>Suspicious:</strong> {userData.suspicious ? "Yes" : "No"}</p>
                        {userData.birthday && <p><strong>Birthday:</strong> {userData.birthday}</p>}
                    </div>

                    {/* Actions Section */}
                    <div className="actions-section">
                        <h3>Available Actions</h3>

                        {(role === 3 || role === 4) ? (
                            <div className="button-group">
                                {!userData.verified && (
                                    <button
                                        className="action-button verify-button"
                                        onClick={handleVerifyUser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Verifying...' : 'Verify User'}
                                    </button>
                                )}
                                {userData.role === "regular" && !userData.suspicious && (
                                    <button
                                        className="action-button promote-button"
                                        onClick={handlePromoteToCashier}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting...' : 'Promote to Cashier'}
                                    </button>
                                )}
                                {userData.role === "cashier" && !userData.suspicious && (
                                    <button
                                        className="action-button suspicious-button"
                                        onClick={handleMarkSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Marking...' : 'Mark Suspicious Flag'}
                                    </button>
                                )}
                                {userData.role === "cashier" && userData.suspicious && (
                                    <button
                                        className="action-button suspicious-button"
                                        onClick={handleClearSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Clearing...' : 'Clear Suspicious Flag'}
                                    </button>
                                )}
                                {userData.role === "cashier" && (
                                    <button
                                        className="action-button revoke-button"
                                        onClick={handleRevokeCashier}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Revoking...' : 'Revoke Cashier Status'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="warning-notice">
                                You must be a Manager or Superuser.
                            </div>
                        )}

                        {role === 4 && (
                            <div className="button-group">
                                {(userData.role === "regular" || userData.role === "cashier") && (
                                    <button
                                        className="action-button promote-button"
                                        onClick={handlePromoteToManager}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting...' : 'Promote to Manager'}
                                    </button>
                                )}
                                {userData.role !== "superuser" && (
                                    <button
                                        className="action-button promote-button"
                                        onClick={handlePromoteToSuperuser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting...' : 'Promote to Superuser'}
                                    </button>
                                )}
                                {userData.role === "manager" && (
                                    <button
                                        className="action-button revoke-button"
                                        onClick={handleRevokeManager}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Revoking...' : 'Revoke Manager Status'}
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Warning for suspicious users */}
                        {userData.role === "regular" && userData.suspicious && (role === 3 || role === 4) && (
                            <div className="warning-notice">
                                Cannot promote to Cashier: User is flagged as suspicious.
                            </div>
                        )}

                        {/* Info for manager/superuser users */}
                        {(userData.role === "manager" || userData.role === "superuser") && role === 3 && (
                            <div className="info-notice">
                                This user is a {userData.role}. Only superusers can modify manager/superuser roles.
                            </div>
                        )}

                        {/* Back button */}
                        <button
                            className="cancel-button"
                            onClick={() => navigate('/all_users')}
                            style={{ marginTop: 'var(--spacing-lg)' }}
                        >
                            Back to All Users
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default UpdateUser;