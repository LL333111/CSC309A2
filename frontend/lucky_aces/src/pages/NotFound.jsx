import "./NotFound.css";

function NotFound() {
    return (
        <div className="page-container">
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h1>404</h1>
                <h3>Page Not Found</h3>
                <p>The page you're looking for doesn't exist.</p>
            </div>
        </div>
    );
}

export default NotFound;
