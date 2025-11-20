import "./style.css"
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoggedInUser } from "../../contexts/LoggedInUserContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const navigate = useNavigate();

  const { role } = useLoggedInUser();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (sectionId, path, e) => {
    e.preventDefault();
    setActiveSection(sectionId);
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="nav-container">
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <p className={`nav-link ${activeSection === "Home" ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("Home", "/", e); }}>Home</p>
            </li>
            {/* Menu when not login*/}
            {role === 0 && <>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "Login" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("Login", "/login", e); }}>Login</p>
              </li>
            </>}
            {/* Menu when regular or higher*/}
            {role >= 1 && <>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "Profile" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("Profile", "/profile", e); }}>Profile</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "EditProfile" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("EditProfile", "/edit_profile", e); }}>Edit Profile</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "ChangePassword" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("ChangePassword", "/change_password", e); }}>Chang Password</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "QRInitTransaction" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("QRInitTransaction", "/qr_init_transaction", e); }}>QR init Transaction</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "TransferTransaction" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("TransferTransaction", "/transfer_transaction", e); }}>Transfer Transaction</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "RedemptionTransaction" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("RedemptionTransaction", "/redemption_transaction", e); }}>Redemption Transaction</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "AllUnprocessedRedemption" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("AllUnprocessedRedemption", "/all_unprocessed_redemption_transaction", e); }}>All Unprocessed Redemption</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "YourPromotions" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("YourPromotions", "/your_promotions", e); }}>Your Promotions</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "AllEvents" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("AllEvents", "/all_events", e); }}>All Events</p>
              </li>
            </>}
            {/* Menu when cashier or higher */}
            {role >= 2 && <>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "Register" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("Register", "/register", e); }}>Register</p>
              </li>
            </>}
            {/* Menu when Manager or higher */}
            {role >= 3 && <>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "AllUsers" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("AllUsers", "/all_users", e); }}>All Users</p>
              </li>
              <li className="nav-item">
                <p className={`nav-link ${activeSection === "AllPromotions" ? 'active' : ''}`}
                  onClick={(e) => { handleNavClick("AllPromotions", "/all_promotions", e); }}>All Promotions</p>
              </li>
            </>}
            <li className="nav-item">
              <p className={`nav-link ${activeSection === "bad" ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("bad", "*", e); }}>bad</p>
            </li>
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