import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Plus, Check } from 'lucide-react';
import api from '../services/api';

const LinkGenerator = () => {
  const [links, setLinks] = useState([]);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksRes, jobsRes] = await Promise.all([
        api.get('/hr/links').catch(() => ({ data: [] })),
        api.get('/hr/jobs').catch(() => ({ data: [] }))
      ]);
      setLinks(linksRes.data || []);
      setAvailableJobs(jobsRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobId.trim()) return;
    
    setGenerating(true);
    setError('');
    try {
      await api.post('/hr/links', { job_id: jobId });
      setJobId('');
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
      setError('Failed to generate link.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (url, token) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Link Generator</h1>
        <p className="text-textSecondary mt-1 text-sm">Create and track 7-day application links for specific jobs</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-brand" /> Create New Target Link
        </h2>
        <form onSubmit={handleGenerate} className="flex gap-4 items-end max-w-2xl">
          <div className="flex-1">
            <label className="block text-sm font-medium text-textSecondary mb-2">Job Title</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="input-field bg-background border border-border text-white w-full rounded-md px-3 py-2 outline-none focus:border-brand"
              required
            >
              <option value="" disabled>Select a job from your org...</option>
              {availableJobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={generating}
            className="btn-primary whitespace-nowrap flex-center gap-2 h-[42px]"
          >
            {generating ? <span className="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full" /> : <LinkIcon size={18} />}
            Generate URL
          </button>
        </form>
        {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      </div>

      <div className="glass-card p-0 overflow-hidden border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-textSecondary">
              <th className="p-4 font-semibold">Job Reference</th>
              <th className="p-4 font-semibold">Application URL</th>
              <th className="p-4 font-semibold">Status / Expiry</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-textSecondary">Loading links...</td></tr>
            ) : links.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-textSecondary">No links generated yet.</td></tr>
            ) : (
              links.map((link) => {
                 const isExpired = new Date(link.expires_at) < new Date();
                 // Generate robust, environment-agnostic apply URL
                 const applyUrl = `${window.location.origin}/apply/${link.token}`;
                 
                 return (
                  <tr key={link.token} className="hover:bg-border/20 transition-colors">
                    <td className="p-4 font-medium text-white truncate max-w-[200px]">
                      {availableJobs.find(j => j.id === link.job_id)?.title || link.job_id}
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-black/40 text-brand px-2 py-1 rounded truncate max-w-[200px] inline-block">
                        {applyUrl}
                      </code>
                    </td>
                    <td className="p-4">
                      {isExpired ? (
                        <span className="status-badge status-rejected">Expired</span>
                      ) : (
                        <span className="status-badge status-hired flex items-center gap-1 w-max">
                          Valid until {new Date(link.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end">
                      <button
                        onClick={() => handleCopy(applyUrl, link.token)}
                        className="p-2 border border-border bg-surface text-textSecondary hover:text-white hover:border-brand/50 rounded-lg transition-colors flex items-center"
                        title="Copy Application Link"
                      >
                        {copiedToken === link.token ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </td>
                  </tr>
                 )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkGenerator;
