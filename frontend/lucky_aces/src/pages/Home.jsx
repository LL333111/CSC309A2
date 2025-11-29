import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container" data-surface="flat">
      <section className="hero-section">
        <h1>A simple dashboard for your team</h1>
        <p>
          Lucky Aces keeps people, roles, and shared activity in one place so any group can stay
          organized, whether it is planning events or tracking rewards.
        </p>
        <div className="cta-buttons">
          <Link to="/published_events" className="cta-button cta-button-primary">See events</Link>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <article className="feature-card">
            <h3>Clear role-based views</h3>
            <p>Navigation and tables adjust based on who is signed in, keeping each role focused on its own tasks.</p>
          </article>
          <article className="feature-card">
            <h3>Reliable point tracking</h3>
            <p>Issue, transfer, and redeem points while keeping balances organized in one place.</p>
          </article>
          <article className="feature-card">
            <h3>Straightforward event insights</h3>
            <p>Check RSVPs and capacity at a glance with a clean set of summary cards.</p>
          </article>
        </div>
      </section>

      <section className="spotlight-section">
        <h2>Meet the minds behind Lucky Aces</h2>
        <div className="spotlight-grid">
          <article className="spotlight-card">
            <div className="portrait-frame portrait-frame-round" aria-hidden="true">
              <img
                src={process.env.PUBLIC_URL + "/jk.jpeg"}
                alt="Jiakun Chen headshot"
                className="portrait-image"
              />
            </div>
            <h3>Jiakun Chen</h3>
            <p>Third year CS student at UofT focusing on software design, web development, and elevated product moments.</p>
          </article>
          <article className="spotlight-card">
            <div className="portrait-frame portrait-frame-round" aria-hidden="true">
              <img
                src={process.env.PUBLIC_URL + "/yl.png"}
                alt="Yuxuan Liu headshot"
                className="portrait-image"
              />
            </div>
            <h3>Yuxuan Liu</h3>
            <p>Third year CS & Math student at UofT concentrating on software development and applied ML for data-rich insights.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Home;