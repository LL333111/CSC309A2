import "./style.css"
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoggedInUser } from "../../contexts/LoggedInUserContext";
import { useSocket } from "../../contexts/SocketContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notificationToasts, setNotificationToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const { role } = useLoggedInUser();
  const { unreadNotification, setUnreadNotification, newNotification } = useSocket();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleNavClick = (sectionId, path, e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setActiveDropdown(null);
    navigate(path);
  };

  const matchPath = (targetPath) => {
    if (targetPath === "/") {
      return location.pathname === "/";
    }
    return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
  };

  const handleNotification = (sectionId, path, e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setActiveDropdown(null);
    setUnreadNotification(false);
    navigate(path);
  };

  const removeToast = (id) => {
    setNotificationToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const accountActive = matchPath("/profile");
  const transactionsActive = [
    "/your_transactions",
    "/qr_init_transaction",
    "/transfer_transaction",
    "/redemption_transaction",
    "/all_unprocessed_redemption_transaction"
  ].some(matchPath);
  const eventsActive = [
    "/published_events",
    "/organizer_events"
  ].some(matchPath);
  const cashierActive = [
    "/register",
    "/process_redemption",
    "/purchase_transaction"
  ].some(matchPath);
  const adminActive = [
    "/all_users",
    "/all_promotions",
    "/all_events",
    "/all_transactions"
  ].some(matchPath);
  const notificationsActive = matchPath("/notifications");

  useEffect(() => {
    if (newNotification !== null) {
      const toastId = Date.now();
      const newToast = {
        id: toastId,
        message: newNotification.message,
        timestamp: new Date().toLocaleTimeString()
      };

      setNotificationToasts(prev => [...prev, newToast]);
    }
  }, [newNotification]);

  return (
    <div>
      <div className="notifications-container">
        {notificationToasts.map((toast, index) => (
          <div
            key={toast.id}
            className="notification-toast"
          >
            <div className="toast-content">
              <div>
                <span>New Notification: {toast.message}</span>
                <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
                  {new Date(newNotification.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <nav className="navbar">
        <div className="nav-container">
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <p className={`nav-link ${matchPath("/") ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("Home", "/", e); }}>Home</p>
            </li>

            {/* Not logged in */}
            {role === 0 && (
              <li className="nav-item">
                <p className={`nav-link ${matchPath("/login") ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("Login", "/login", e); }}>Login</p>
              </li>
            )}

            {/* Logged in users (role >= 1) */}
            {role >= 1 && (
              <>
                {/* Account Dropdown */}
                <li className="nav-item dropdown">
                  <p className={`nav-link dropdown-toggle ${accountActive ? 'active' : ''}`} onClick={() => toggleDropdown('account')}>
                    Account
                  </p>
                  <ul className={`dropdown-menu ${activeDropdown === 'account' ? 'show' : ''}`}>
                    <li
                      className={matchPath("/profile") ? 'active' : ''}
                      onClick={(e) => handleNavClick("Profile", "/profile", e)}
                    >
                      Profile
                    </li>
                  </ul>
                </li>

                {/* Transactions Dropdown */}
                <li className="nav-item dropdown">
                  <p className={`nav-link dropdown-toggle ${transactionsActive ? 'active' : ''}`} onClick={() => toggleDropdown('transactions')}>
                    Transactions
                  </p>
                  <ul className={`dropdown-menu ${activeDropdown === 'transactions' ? 'show' : ''}`}>
                    <li className={matchPath("/your_transactions") ? 'active' : ''} onClick={(e) => handleNavClick("YourTransactions", "/your_transactions", e)}>Recent Transactions</li>
                    <li className={matchPath("/qr_init_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("QRInitTransaction", "/qr_init_transaction", e)}>QR Init Transaction</li>
                    <li className={matchPath("/transfer_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("TransferTransaction", "/transfer_transaction", e)}>Transfer Points</li>
                    <li className={matchPath("/redemption_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("RedemptionTransaction", "/redemption_transaction", e)}>Redeem Rewards</li>
                    <li className={matchPath("/all_unprocessed_redemption_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("AllUnprocessedRedemption", "/all_unprocessed_redemption_transaction", e)}>Unprocessed Redemptions</li>
                  </ul>
                </li>

                {/* Events Dropdown */}
                <li className="nav-item dropdown">
                  <p className={`nav-link dropdown-toggle ${eventsActive ? 'active' : ''}`} onClick={() => toggleDropdown('events')}>
                    Events
                  </p>
                  <ul className={`dropdown-menu ${activeDropdown === 'events' ? 'show' : ''}`}>
                    <li className={matchPath("/published_events") ? 'active' : ''} onClick={(e) => handleNavClick("PublishedEvents", "/published_events", e)}>Published Events</li>
                    <li className={matchPath("/organizer_events") ? 'active' : ''} onClick={(e) => handleNavClick("OrganizerEvents", "/organizer_events", e)}>Organize Events</li>
                  </ul>
                </li>

                {/* Promotions */}
                <li className="nav-item">
                  <p className={`nav-link ${matchPath("/your_promotions") ? 'active' : ''}`}
                    onClick={(e) => { handleNavClick("YourPromotions", "/your_promotions", e); }}>Promotions</p>
                </li>

                {/* Notifications */}
                <li className="nav-item">
                  <p className={`nav-link ${notificationsActive ? 'active' : ''} ${unreadNotification ? 'has-notification' : ''}`}
                    onClick={(e) => { handleNotification("Notifications", "/notifications", e); }}>
                    Notifications
                    {unreadNotification && <span className="notification-badge"></span>}
                  </p>
                </li>
              </>
            )}

            {/* Cashier or higher (role >= 2) */}
            {role >= 2 && (
              <li className="nav-item dropdown">
                <p className={`nav-link dropdown-toggle ${cashierActive ? 'active' : ''}`} onClick={() => toggleDropdown('cashier')}>
                  Cashier
                </p>
                <ul className={`dropdown-menu ${activeDropdown === 'cashier' ? 'show' : ''}`}>
                  <li className={matchPath("/register") ? 'active' : ''} onClick={(e) => handleNavClick("Register", "/register", e)}>Register User</li>
                  <li className={matchPath("/process_redemption") ? 'active' : ''} onClick={(e) => handleNavClick("ProcessRedemption", "/process_redemption", e)}>Process Redemption</li>
                  <li className={matchPath("/purchase_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("CreatePurchaseTransaction", "/purchase_transaction", e)}>Create Purchase</li>
                </ul>
              </li>
            )}

            {/* Manager or higher (role >= 3) */}
            {role >= 3 && (
              <li className="nav-item dropdown">
                <p className={`nav-link dropdown-toggle ${adminActive ? 'active' : ''}`} onClick={() => toggleDropdown('admin')}>
                  Admin
                </p>
                <ul className={`dropdown-menu ${activeDropdown === 'admin' ? 'show' : ''}`}>
                  <li className={matchPath("/all_users") ? 'active' : ''} onClick={(e) => handleNavClick("AllUsers", "/all_users", e)}>Manage Users</li>
                  <li className={matchPath("/all_promotions") ? 'active' : ''} onClick={(e) => handleNavClick("AllPromotions", "/all_promotions", e)}>Manage Promotions</li>
                  <li className={matchPath("/all_events") ? 'active' : ''} onClick={(e) => handleNavClick("AllEvents", "/all_events", e)}>Manage Events</li>
                  <li className={matchPath("/all_transactions") ? 'active' : ''} onClick={(e) => handleNavClick("AllTransactions", "/all_transactions", e)}>Manage Transactions</li>
                </ul>
              </li>
            )}
          </ul>

          <button className="hamburger" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Navbar