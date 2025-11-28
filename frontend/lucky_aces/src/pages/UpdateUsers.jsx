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
    const isLoadingUser = _loading || !userData;
    const hasManagerPrivileges = role === 3 || role === 4;
    const isSuperuser = role === 4;
    const roleBadgeClass = userData?.role ? `role-${userData.role}` : 'role-regular';

    return (
        <div className="update-user-container" data-surface="flat">
            {isLoadingUser ? (
                <div className="loading-container">
                    <h2>Loading...</h2>
                    <p>Retrieving member details.</p>
                </div>
            ) : !userData ? (
                <div className="error-container">
                    <h2>User Not Found</h2>
                    <button className="back-btn" onClick={() => navigate('/all_users')}>
                        Back to All Users
                    </button>
                </div>
            ) : (
                <div className="user-detail-card">
                    <div className="user-header">
                        <div>
                            <p className="eyebrow">Directory · User Detail</p>
                            <h1 className="page-title">{userData.name || userData.email || 'Update User'}</h1>
                            <p className="user-subtitle">Adjust permissions, verification state, and trust flags for this account.</p>
                        </div>
                        <div className="user-header-meta">
                            <span className={`status-badge ${roleBadgeClass}`}>{userData.role || 'unknown'}</span>
                            {userData.suspicious && <span className="status-badge status-flagged">Flagged</span>}
                        </div>
                    </div>

                    <div className="user-info-grid">
                        <div className="info-item">
                            <strong>User ID</strong>
                            <p>{userId}</p>
                        </div>
                        <div className="info-item">
                            <strong>Email</strong>
                            <p>{userData.email || '—'}</p>
                        </div>
                        <div className="info-item">
                            <strong>Points</strong>
                            <p>{userData.points ?? 0}</p>
                        </div>
                        <div className="info-item">
                            <strong>Verified</strong>
                            <p>{userData.verified ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="info-item">
                            <strong>Activated</strong>
                            <p>{userData.activated ? 'Yes' : 'No'}</p>
                        </div>
                        {userData.birthday && (
                            <div className="info-item">
                                <strong>Birthday</strong>
                                <p>{userData.birthday}</p>
                            </div>
                        )}
                    </div>

                    <div className="status-pill-row">
                        <span className={`status-pill ${userData.verified ? 'status-verified' : 'status-unverified'}`}>
                            {userData.verified ? 'Verified' : 'Unverified'}
                        </span>
                        <span className={`status-pill ${userData.activated ? 'status-active' : 'status-inactive'}`}>
                            {userData.activated ? 'Activated' : 'Inactive'}
                        </span>
                        {userData.suspicious && (
                            <span className="status-pill status-flagged">Suspicious</span>
                        )}
                    </div>

                    <div className="action-section">
                        <h3>Manager Controls</h3>
                        {hasManagerPrivileges ? (
                            <div className="action-grid">
                                {!userData.verified && (
                                    <button
                                        className="action-btn action-success"
                                        onClick={handleVerifyUser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Verifying…' : 'Verify User'}
                                    </button>
                                )}
                                {userData.role === "regular" && !userData.suspicious && (
                                    <button
                                        className="action-btn action-primary"
                                        onClick={handlePromoteToCashier}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting…' : 'Promote to Cashier'}
                                    </button>
                                )}
                                {userData.role === "cashier" && !userData.suspicious && (
                                    <button
                                        className="action-btn action-warning"
                                        onClick={handleMarkSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Flagging…' : 'Mark Suspicious'}
                                    </button>
                                )}
                                {userData.role === "cashier" && userData.suspicious && (
                                    <button
                                        className="action-btn action-warning"
                                        onClick={handleClearSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Clearing…' : 'Clear Suspicious Flag'}
                                    </button>
                                )}
                                {userData.role === "cashier" && (
                                    <button
                                        className="action-btn action-danger"
                                        onClick={handleRevokeCashier}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Revoking…' : 'Revoke Cashier Role'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="notice warning-notice">
                                You must be a manager or superuser to update this account.
                            </div>
                        )}
                    </div>

                    {isSuperuser && (
                        <div className="action-section">
                            <h3>Superuser Controls</h3>
                            <div className="action-grid">
                                {(userData.role === "regular" || userData.role === "cashier") && (
                                    <button
                                        className="action-btn action-primary"
                                        onClick={handlePromoteToManager}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting…' : 'Promote to Manager'}
                                    </button>
                                )}
                                {userData.role !== "superuser" && (
                                    <button
                                        className="action-btn action-primary"
                                        onClick={handlePromoteToSuperuser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Promoting…' : 'Promote to Superuser'}
                                    </button>
                                )}
                                {userData.role === "manager" && (
                                    <button
                                        className="action-btn action-danger"
                                        onClick={handleRevokeManager}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Revoking…' : 'Revoke Manager Role'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {userData.role === "regular" && userData.suspicious && hasManagerPrivileges && (
                        <div className="notice warning-notice">
                            Cannot promote to cashier while the suspicious flag is active.
                        </div>
                    )}

                    {(userData.role === "manager" || userData.role === "superuser") && role === 3 && (
                        <div className="notice info-notice">
                            This account is {userData.role}. Only superusers can modify manager or superuser roles.
                        </div>
                    )}

                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate('/all_users')}
                    >
                        Back to All Users
                    </button>
                </div>
            )}
        </div>
    );
}

export default UpdateUser;