import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Search, ChevronRight, UserCircle2 } from 'lucide-react';

const CandidatesDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/hr/candidates?limit=50&sort_desc=true');
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      'APPLIED': '#378ADD',
      'SCREENING': '#EF9F27',
      'INTERVIEWING': '#7A5CFF',
      'OFFERED': '#1D9E75',
      'HIRED': '#1D9E75',
      'REJECTED': '#E24B4A',
    };
    return map[status] || '#A0A4B8';
  };

  const filtered = candidates.filter(c => 
    (c.first_name + ' ' + c.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2>Candidate Pipeline</h2>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search candidates..." 
            className="input-field"
            style={{ paddingLeft: 40, width: 300 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>
              <th style={{ padding: '20px 10px', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '20px 10px', fontWeight: 500 }}>Applied</th>
              <th style={{ padding: '20px 10px', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '20px 10px', fontWeight: 500, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="hover-scale" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <td style={{ padding: '20px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <UserCircle2 size={32} color="var(--color-brand)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{c.email}</div>
                  </div>
                </td>
                <td style={{ padding: '20px 10px', color: 'var(--color-text-secondary)' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '20px 10px' }}>
                  <span className="status-badge" style={{ background: `${getStatusColor(c.status)}20`, color: getStatusColor(c.status) }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '20px 10px', textAlign: 'right' }}>
                  <button className="btn-primary" style={{ padding: '8px 12px', background: 'transparent', color: 'var(--color-text-secondary)' }}>
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No candidates match search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidatesDashboard;
