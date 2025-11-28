import "./style.css"
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoggedInUser } from "../../contexts/LoggedInUserContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { role } = useLoggedInUser();

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

  return (
    <div>
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
                    <li className={matchPath("/your_transactions") ? 'active' : ''} onClick={(e) => handleNavClick("YourTransactions", "/your_transactions", e)}>My Transactions</li>
                    <li className={matchPath("/qr_init_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("QRInitTransaction", "/qr_init_transaction", e)}>QR Transaction</li>
                    <li className={matchPath("/transfer_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("TransferTransaction", "/transfer_transaction", e)}>Transfer Points</li>
                    <li className={matchPath("/redemption_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("RedemptionTransaction", "/redemption_transaction", e)}>Redeem Rewards</li>
                    <li className={matchPath("/all_unprocessed_redemption_transaction") ? 'active' : ''} onClick={(e) => handleNavClick("AllUnprocessedRedemption", "/all_unprocessed_redemption_transaction", e)}>Pending Redemptions</li>
                  </ul>
                </li>

                {/* Events Dropdown */}
                <li className="nav-item dropdown">
                  <p className={`nav-link dropdown-toggle ${eventsActive ? 'active' : ''}`} onClick={() => toggleDropdown('events')}>
                    Events
                  </p>
                  <ul className={`dropdown-menu ${activeDropdown === 'events' ? 'show' : ''}`}>
                    <li className={matchPath("/published_events") ? 'active' : ''} onClick={(e) => handleNavClick("PublishedEvents", "/published_events", e)}>Browse Events</li>
                    <li className={matchPath("/organizer_events") ? 'active' : ''} onClick={(e) => handleNavClick("OrganizerEvents", "/organizer_events", e)}>My Events</li>
                  </ul>
                </li>

                {/* Promotions */}
                <li className="nav-item">
                  <p className={`nav-link ${matchPath("/your_promotions") ? 'active' : ''}`}
                    onClick={(e) => { handleNavClick("YourPromotions", "/your_promotions", e); }}>Promotions</p>
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
                  <li className={matchPath("/all_transactions") ? 'active' : ''} onClick={(e) => handleNavClick("AllTransactions", "/all_transactions", e)}>All Transactions</li>
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