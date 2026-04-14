import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Link, FileText, Mail, Settings, LogOut, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: <Users size={20} />, label: 'Candidates' },
    { to: '/organization', icon: <Building size={20} />, label: 'Organization' },
    { to: '/links', icon: <Link size={20} />, label: 'Link Generator' },
    { to: '/templates', icon: <FileText size={20} />, label: 'Templates' },
    { to: '/queue', icon: <Mail size={20} />, label: 'Email Queue' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 text-textSecondary">
      <div className="p-6 border-b border-border flex items-center justify-center">
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">ATS HR</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors overflow-hidden ${
                isActive
                  ? 'bg-brand/10 text-brand font-medium'
                  : 'hover:bg-border/50 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
