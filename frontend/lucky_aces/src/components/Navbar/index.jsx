import "./style.css"
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

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
      {/* <nav>
        <Link to="/" className="link">Home</Link>
        <Link to="/login" className="link">Login</Link>
        <Link to="/profile" className="link">Profile</Link>
        <Link to="*" className="link">bad</Link>
      </nav>
      <hr /> */}
      <nav className="navbar">
        <div className="nav-container">
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <p className={`nav-link ${activeSection === "Home" ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("Home", "/", e); }}>Home</p>
            </li>
            <li className="nav-item">
              <p className={`nav-link ${activeSection === "Login" ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("Login", "/login", e); }}>Login</p>
            </li>
            <li className="nav-item">
              <p className={`nav-link ${activeSection === "Profile" ? 'active' : ''}`}
                onClick={(e) => { handleNavClick("Profile", "/profile", e); }}>Profile</p>
            </li>
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