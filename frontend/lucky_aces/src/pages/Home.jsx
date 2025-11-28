import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container" data-surface="flat">
      <section className="hero-section">
        <h1>Luxury loyalty for every campus experience</h1>
        <p>
          Lucky Aces elevates student events with curated rewards, transparent role-aware
          access, and instant insights across promotions, points, and RSVPs.
        </p>
        <div className="cta-buttons">
          <Link to="/published_events" className="cta-button cta-button-primary">Discover events</Link>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <article className="feature-card">
            <h3>Role-smart navigation</h3>
            <p>Navigation, cards, and tables adapt automatically, so each user only sees the journeys they are allowed to access.</p>
          </article>
          <article className="feature-card">
            <h3>High fidelity tracking</h3>
            <p>Issue, transfer, and redeem points with elevated UI cues, timeline markers, and subtle validations.</p>
          </article>
          <article className="feature-card">
            <h3>Event intelligence</h3>
            <p>Monitor RSVPs, attendance caps, and sponsorship perks through refined cards and gradient analytics.</p>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <h2>Trusted by curated organizers</h2>
        <div className="stats-grid">
          <article className="stat-card">
            <p className="stat-number">480+</p>
            <p className="stat-label">Exclusive events</p>
          </article>
          <article className="stat-card">
            <p className="stat-number">12k</p>
            <p className="stat-label">Active members</p>
          </article>
          <article className="stat-card">
            <p className="stat-number">95%</p>
            <p className="stat-label">Redemption satisfaction</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Home;