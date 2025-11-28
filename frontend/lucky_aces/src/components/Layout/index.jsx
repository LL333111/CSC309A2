import "./style.css"
import { Link, Outlet } from 'react-router-dom';
import Navbar from "../Navbar";

const Layout = () => {
  const get_academic_term = () => {
    const month = new Date().getMonth() + 1; // getMonth() is 0-indexed, so add 1
    const year = new Date().getFullYear();

    let season;

    if (month >= 1 && month <= 4) {
      season = "Winter";
    } else if (month >= 5 && month <= 8) {
      season = "Summer";
    } else {
      season = "Fall";
    }

    return `${season} ${year}`;
  };

  const academicTerm = get_academic_term();

  return <>
    <header className="app-header">
      <div className="brand-block">
        <Link to="/" className="brand-link">Lucky Aces</Link>
        <p className="brand-tagline">Premium loyalty for curated student events</p>
      </div>
      <span className="term-pill">{academicTerm}</span>
    </header>
    <main>
      <Navbar />
      <div className="page-shell">
        <Outlet />
      </div>
    </main>
    <footer className="app-footer">
      <p>&copy; CSC309, {academicTerm}, University of Toronto.</p>
      <p className="footer-note">Role-aware access ensured across every dashboard view.</p>
    </footer>
  </>;
};

export default Layout;