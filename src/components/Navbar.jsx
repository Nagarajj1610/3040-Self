import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut, Award, ClipboardList, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, profile, logout } = useAuth();

  if (!user || !profile) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Leaf size={24} color="#10b981" fill="#10b981" />
          <span>3040 Self</span>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Log Trip
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/history" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              History
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/streaks" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Award size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Streaks
            </NavLink>
          </li>
          
          <li style={{ marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              {profile.name} ({profile.persona})
            </span>
            <button 
              onClick={logout} 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
