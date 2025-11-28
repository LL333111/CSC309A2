import { useState, useEffect } from 'react';
import { getTransactionById, createAdjustment, markTransactionSuspicious } from '../APIRequest';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import "./SpecificTransaction.css";

function SpecificTransaction() {
    const [_loading, _setLoading] = useState(true);
    const [transactionData, setTransactionData] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Adjustment form fields
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentRemark, setAdjustmentRemark] = useState("");

    const { loading, token, role } = useLoggedInUser();
    const { transactionId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            _setLoading(loading);
        }, 500);
        return () => clearTimeout(timer);
    }, [loading]);

    const fetchTransaction = async () => {
        try {
            const data = await getTransactionById(transactionId, token);
            console.log(data);
            setTransactionData(data);
        } catch (error) {
            console.error("Failed to fetch the specific transaction:", error);
        }
    }

    // Fetch transaction data when component mounts
    useEffect(() => {
        if (!_loading && token) {
            fetchTransaction();
        }
    }, [_loading, token, transactionId]);

    const handleCreateAdjustment = async (e) => {
        e.preventDefault();

        if (!adjustmentAmount || isNaN(adjustmentAmount)) {
            alert("Please enter a valid amount");
            return;
        }

        if (window.confirm(`Create adjustment of ${adjustmentAmount} points for this transaction?`)) {
            setActionLoading(true);
            try {
                // Convert promotionIds array of objects to array of numbers, or null if empty
                const promotionIds = transactionData.promotionIds?.length > 0
                    ? transactionData.promotionIds.map(p => p.id)
                    : null;

                const amountInt = parseInt(adjustmentAmount, 10);
                const relatedIdInt = parseInt(transactionId, 10);

                console.log("Creating adjustment with:", {
                    utorid: transactionData.utorid,
                    amount: amountInt,
                    relatedId: relatedIdInt,
                    promotionIds,
                    remark: adjustmentRemark || null
                });

                const status = await createAdjustment(
                    transactionData.utorid,
                    amountInt,
                    relatedIdInt,
                    promotionIds,
                    adjustmentRemark || null,
                    token
                );

                if (status === 201) {
                    alert("Adjustment created successfully!");
                    setAdjustmentAmount("");
                    setAdjustmentRemark("");
                    await fetchTransaction();
                } else {
                    alert(`Failed to create adjustment. Status: ${status}`);
                }
            } catch (error) {
                console.error("Failed to create adjustment:", error);
                alert("Failed to create adjustment");
            } finally {
                setActionLoading(false);
            }
        }
    }

    const handleMarkSuspicious = async () => {
        if (window.confirm("Mark this transaction as suspicious?")) {
            setActionLoading(true);
            try {
                const status = await markTransactionSuspicious(transactionId, true, token);

                if (status === 200) {
                    alert("Transaction marked as suspicious!");
                    await fetchTransaction();
                } else {
                    alert("Failed to mark transaction as suspicious");
                }
            } catch (error) {
                console.error("Failed to mark suspicious:", error);
                alert("Failed to mark transaction as suspicious");
            } finally {
                setActionLoading(false);
            }
        }
    }

    const handleUnmarkSuspicious = async () => {
        if (window.confirm("Unmark this transaction as suspicious?")) {
            setActionLoading(true);
            try {
                const status = await markTransactionSuspicious(transactionId, false, token);

                if (status === 200) {
                    alert("Transaction unmarked as suspicious!");
                    await fetchTransaction();
                } else {
                    alert("Failed to unmark transaction as suspicious");
                }
            } catch (error) {
                console.error("Failed to unmark suspicious:", error);
                alert("Failed to unmark transaction as suspicious");
            } finally {
                setActionLoading(false);
            }
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    }

    return (
        <div className="specific-transaction-container">
            {_loading || !transactionData ? (
                <div className="loading-container">
                    <h2>Loading...</h2>
                </div>
            ) : (
                <>
                    <div className="transaction-page-header">
                        <div>
                            <p className="eyebrow">Ledger · Transaction Detail</p>
                            <h1 className="page-title">Transaction #{transactionData.id}</h1>
                            <p className="page-subtitle">
                                Full audit trail for {transactionData.utorid ? `UTORid ${transactionData.utorid}` : 'this record'}.
                            </p>
                        </div>
                        <div className="transaction-header-meta">
                            <span className={`type-badge type-${transactionData.type}`}>
                                {transactionData.type?.toUpperCase()}
                            </span>
                            {transactionData.suspicious && (
                                <span className="suspicious-badge">⚠ Suspicious</span>
                            )}
                        </div>
                    </div>

                    {/* Transaction Information Card */}
                    <div className="transaction-info-card">
                        <h2>Transaction Details</h2>

                        <div className="transaction-details-grid">
                            <p><strong>Transaction ID:</strong> {transactionData.id}</p>
                            <p><strong>Type:</strong> {transactionData.type}</p>
                            <p><strong>Created At:</strong> {formatDate(transactionData.createdAt)}</p>

                            {transactionData.type === "purchase" && (
                                <>
                                    <p><strong>User (UTORid):</strong> {transactionData.utorid}</p>
                                    <p><strong>Spent:</strong> ${transactionData.spent}</p>
                                    <p><strong>Points Earned:</strong> {transactionData.amount}</p>
                                    <p><strong>Promotions Used:</strong> {transactionData.promotionIds?.length === 0 ? "None" : transactionData.promotionIds?.map(p => p.id).join(', ')}</p>
                                    <p><strong>Remark:</strong> {transactionData.remark || "None"}</p>
                                    <p><strong>Created By:</strong> {transactionData.createdBy}</p>
                                </>
                            )}

                            {transactionData.type === "adjustment" && (
                                <>
                                    <p><strong>User (UTORid):</strong> {transactionData.utorid}</p>
                                    <p><strong>Amount:</strong> {transactionData.amount}</p>
                                    <p><strong>Related Transaction:</strong> {transactionData.relatedId}</p>
                                    <p><strong>Promotions:</strong> {transactionData.promotionIds?.length === 0 ? "None" : transactionData.promotionIds?.map(p => p.id).join(', ')}</p>
                                    <p><strong>Remark:</strong> {transactionData.remark || "None"}</p>
                                    <p><strong>Created By:</strong> {transactionData.createdBy}</p>
                                </>
                            )}

                            {transactionData.type === "transfer" && (
                                <>
                                    <p><strong>Sender:</strong> {transactionData.sender}</p>
                                    <p><strong>Recipient:</strong> {transactionData.recipient}</p>
                                    <p><strong>Amount Sent:</strong> {transactionData.sent}</p>
                                    <p><strong>Remark:</strong> {transactionData.remark || "None"}</p>
                                </>
                            )}

                            {transactionData.type === "redemption" && (
                                <>
                                    <p><strong>User (UTORid):</strong> {transactionData.utorid}</p>
                                    <p><strong>Points Redeemed:</strong> {transactionData.redeemed}</p>
                                    <p><strong>Remark:</strong> {transactionData.remark || "None"}</p>
                                    <p><strong>Created By:</strong> {transactionData.createdBy}</p>
                                    <p><strong>Processed:</strong> {transactionData.relatedId ? `Yes (ID: ${transactionData.relatedId})` : "Unprocessed"}</p>
                                </>
                            )}

                            {transactionData.type === "event" && (
                                <>
                                    <p><strong>Recipient:</strong> {transactionData.recipient}</p>
                                    <p><strong>Points Awarded:</strong> {transactionData.awarded}</p>
                                    <p><strong>Event ID:</strong> {transactionData.relatedId}</p>
                                    <p><strong>Remark:</strong> {transactionData.remark || "None"}</p>
                                    <p><strong>Created By:</strong> {transactionData.createdBy}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions Section - Only for Cashier or higher */}
                    {(role === 2 || role === 3 || role === 4) && (
                        <div className="actions-section">
                            <h3>Actions</h3>

                            {/* Create Adjustment Form */}
                            {!transactionData.suspicious && transactionData.type !== "adjustment" && (
                                <>
                                    <h3 style={{ fontSize: 'var(--font-size-md)', marginTop: 0 }}>Create Adjustment</h3>
                                    <form className="adjustment-form" onSubmit={handleCreateAdjustment}>
                                        <div className="form-group">
                                            <label htmlFor="adjustment-amount">Adjustment Amount (points)*</label>
                                            <input
                                                type="number"
                                                id="adjustment-amount"
                                                value={adjustmentAmount}
                                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                placeholder="Enter adjustment amount..."
                                                disabled={actionLoading}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="adjustment-remark">Remark (optional)</label>
                                            <textarea
                                                id="adjustment-remark"
                                                value={adjustmentRemark}
                                                onChange={(e) => setAdjustmentRemark(e.target.value)}
                                                placeholder="Enter remark..."
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="action-btn create-adjustment-btn"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? "Creating..." : "Create Adjustment"}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* Mark Suspicious Button */}
                            {!transactionData.suspicious && (
                                <div className="button-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <button
                                        className="action-btn mark-suspicious-btn"
                                        onClick={handleMarkSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "Marking..." : " Mark as Suspicious"}
                                    </button>
                                </div>
                            )}

                            {transactionData.suspicious && (
                                <div className="warning-notice">
                                    This transaction has been marked as suspicious and cannot be adjusted.
                                </div>
                            )}

                            {transactionData.type === "adjustment" && (
                                <div className="info-notice">
                                    This is already an adjustment transaction. No further adjustments can be created.
                                </div>
                            )}

                            {(role >= 3 && transactionData.type !== "adjustment" && transactionData.suspicious) && (

                                <div className="button-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <button
                                        className="action-btn unmark-suspicious-btn"
                                        onClick={handleUnmarkSuspicious}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "Unmarking..." : " Unmark as Suspicious"}
                                    </button>
                                </div>
                            )}
                        </div>

                    )}
                    {role < 2 && (
                        <div className="actions-section">
                            <div className="warning-notice">
                                You must be a Cashier or higher.
                            </div>
                        </div>
                    )}

                    {/* Back Button */}
                    <button
                        className="action-btn back-btn"
                        onClick={() => navigate('/all_transactions')}
                    >
                        Back to All Transactions
                    </button>
                </>
            )}
        </div>
    )
}

export default SpecificTransaction;