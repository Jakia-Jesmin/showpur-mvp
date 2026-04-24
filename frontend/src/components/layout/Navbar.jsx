import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Navigation() {
  const { user, logout, isProducer, isShowroom } = useAuth();
  
  // Improved subdomain detection for local and production
  const hostname = window.location.hostname;
  const isSubdomain = hostname.includes('.') && 
                     !hostname.startsWith('www.') && 
                     !['localhost', '127.0.0.1'].includes(hostname.split(':')[0]);

  // If on a showroom's specific subdomain
  if (isSubdomain) {
    return (
      <nav className="subdomain-nav">
        <div className="nav-container">
          <div className="logo">
            <Link to="/">ShowPur</Link>
          </div>
          <div className="nav-links">
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button onClick={logout} className="nav-btn-link">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Regular navigation for the main marketplace
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="logo">
          <Link to="/">ShowPur</Link>
        </div>
        <div className="nav-links">
          {user ? (
            <>
              {/* Feature A: Conditional links based on Role */}
              {isProducer && <Link to="/dashboard/find-showrooms">Find Showrooms</Link>}
              {isShowroom && <Link to="/dashboard/requests">Connection Requests</Link>}
              
              <Link to="/dashboard">My Dashboard</Link>
              <button onClick={logout} className="nav-btn-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="nav-cta">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
