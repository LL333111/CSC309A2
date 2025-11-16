// import "./style.css"
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div>
      <nav>
        <Link to="/" className="link">Home</Link>
        <Link to="/login" className="link">Login</Link>
        <Link to="*" className="link">bad</Link>
      </nav>
      <hr />
    </div>
  )
}

export default Navbar