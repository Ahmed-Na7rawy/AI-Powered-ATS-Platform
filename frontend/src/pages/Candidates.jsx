import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';
import CandidateDrawer from '../components/Candidates/CandidateDrawer';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/candidates?limit=100');
      setCandidates(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setCandidates((prev) => 
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = 
        `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Candidates</h1>
          <p className="text-textSecondary mt-1 text-sm">Review applications and manage pipeline</p>
        </div>
        <button onClick={fetchCandidates} className="p-2 bg-surface border border-border text-textSecondary hover:text-white rounded-lg transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary" size={18} />
          <input
            type="text"
            placeholder="Search name or email..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filter */}
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-10 appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="INTERVIEW">Interview</option>
            <option value="REJECTED">Rejected</option>
            <option value="HIRED">Hired</option>
          </select>
        </div>
      </div>

      {/* error state */}
      {error && <div className="p-4 bg-danger/10 text-danger border border-danger/30 rounded-lg">{error}</div>}

      {/* Table */}
      <div className="glass-card overflow-hidden p-0 border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-textSecondary">
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Applied Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-textSecondary">Loading candidates...</td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-textSecondary">No candidates found matching filters.</td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr 
                    key={candidate.id} 
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className="hover:bg-border/30 cursor-pointer transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-medium text-white group-hover:text-brand transition-colors">
                        {candidate.first_name} {candidate.last_name}
                      </div>
                      <div className="text-sm text-textSecondary">{candidate.email}</div>
                    </td>
                    <td className="p-4 text-sm text-textSecondary">
                      {candidate.job_id}
                    </td>
                    <td className="p-4">
                      <span className={`status-badge status-${candidate.status.toLowerCase()}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-textSecondary">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CandidateDrawer 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidateId(null)}
        onStatusChange={handleStatusChange}
      />
      
    </div>
  );
};

export default Candidates;
