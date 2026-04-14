import React, { useState, useEffect } from 'react';
import { X, FileText, Activity, CheckCircle, RefreshCw, Cpu } from 'lucide-react';
import api, { getAuthToken } from '../../services/api';

const fetchActivities = async (candidateId) => {
  const res = await api.get(`/hr/candidates/${candidateId}/activities`);
  return res.data;
};

const CandidateDrawer = ({ candidate, onClose, onStatusChange }) => {
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  // Still provide absolute download link
  const backendBaseUrl = api.defaults.baseURL || 'http://127.0.0.1:8000';
  const cleanBaseUrl = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
  const resumeDownloadUrl = candidate ? `${cleanBaseUrl}/hr/candidates/${candidate.id}/resume.pdf?token=${getAuthToken()}` : null;

  useEffect(() => {
    if (candidate) {
      setLoadingActivities(true);
      fetchActivities(candidate.id)
        .then(setActivities)
        .catch(console.error)
        .finally(() => setLoadingActivities(false));
        
      setLoadingText(true);
      api.get(`/hr/candidates/${candidate.id}/resume/text`)
        .then(res => setResumeText(res.data.text))
        .catch(err => {
          console.error("Text extraction fail:", err);
          setResumeText("Error: Unable to extract text mechanically. Download the raw file to view.");
        })
        .finally(() => setLoadingText(false));
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === candidate.status) return;
    
    const oldStatus = candidate.status;
    
    // OPTIMISTIC UI UPDATE
    onStatusChange(candidate.id, newStatus);
    
    try {
      await api.put(`/hr/candidates/${candidate.id}/status`, { status: newStatus });
      // Fetch latest activities after successful status change
      const newActs = await fetchActivities(candidate.id);
      setActivities(newActs);
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert optimistic update using cached oldStatus
      onStatusChange(candidate.id, oldStatus); 
    }
  };

  const handleSummarize = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.post('/ai/summarize-resume', {
        candidate_id: candidate.id
      });
      // The backend now returns { score: number, content: string }
      setSummary(res.data);
    } catch (error) {
      console.error("Failed to summarize", error);
      const backendError = error.response?.data?.detail || "Please check your Gemini API key and backend logs.";
      setSummary({ content: `Failed to generate summary: ${backendError}`, score: null });
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-lg h-full bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {candidate.first_name} {candidate.last_name}
            </h2>
            <p className="text-textSecondary text-sm">{candidate.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-full text-textSecondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Status Control */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-textSecondary flex items-center gap-2">
              <CheckCircle size={16}/> Application Status
            </h3>
            <select
              value={candidate.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="w-full input-field bg-background border-border text-white px-4 py-3"
            >
              <option value="APPLIED">Applied</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="INTERVIEW">Interview</option>
              <option value="REJECTED">Rejected</option>
              <option value="HIRED">Hired</option>
            </select>
          </div>

          {/* AI Summarization Feature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-textSecondary flex items-center gap-2">
                <Cpu size={16} className="text-brand"/> AI Analysis
              </h3>
            </div>
            
            {!summary && !loadingSummary && (
              <button onClick={handleSummarize} className="w-full btn-secondary flex-center gap-2 border-brand/50 text-brand hover:bg-brand/10">
                <Cpu size={18} /> Summarize Resume with AI
              </button>
            )}

            {loadingSummary && (
              <div className="p-4 bg-background border border-border rounded-lg space-y-3 animate-pulse">
                <div className="h-4 bg-border/50 rounded w-3/4"></div>
                <div className="h-4 bg-border/50 rounded w-full"></div>
                <div className="h-4 bg-border/50 rounded w-5/6"></div>
              </div>
            )}

            {summary && !loadingSummary && (
              <div className="p-5 bg-background border border-brand/30 rounded-lg space-y-4">
                {summary.score !== null && summary.score !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-textSecondary uppercase tracking-wide">Compatibility Score</span>
                      <span className={`text-lg font-bold ${summary.score > 75 ? 'text-green-400' : summary.score > 50 ? 'text-yellow-400' : 'text-danger'}`}>
                        {summary.score}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
                      <div 
                        className={`h-full transition-all duration-1000 ${summary.score > 75 ? 'bg-green-500' : summary.score > 50 ? 'bg-yellow-500' : 'bg-danger'}`}
                        style={{ width: `${Math.max(0, Math.min(100, summary.score))}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-border/50">
                  <p className="whitespace-pre-wrap text-sm text-textPrimary leading-relaxed">
                    {summary.content}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Resume Preview */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-textSecondary flex items-center gap-2">
                 <FileText size={16}/> Resume Preview
               </h3>
               {resumeDownloadUrl && (
                 <a 
                   href={resumeDownloadUrl} 
                   download={`${candidate.first_name}_${candidate.last_name}_Resume`}
                   className="text-xs text-brand hover:text-brand/80 transition-colors"
                 >
                   Download Original PDF/Doc
                 </a>
               )}
             </div>
             
             <div className="rounded-lg border border-border overflow-hidden bg-background">
                {loadingText ? (
                   <div className="flex items-center justify-center min-h-[300px] text-textSecondary">
                     <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full mr-3" />
                     Extracting plaintext preview...
                   </div>
                ) : (
                   <div className="w-full h-[650px] overflow-y-auto p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#d1d5db] bg-[#1f2937]">
                     {resumeText || "No text available for this document."}
                   </div>
                )}
             </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-textSecondary flex items-center gap-2">
              <Activity size={16}/> Activity Timeline
            </h3>
            {loadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-brand" size={24} />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-textSecondary text-sm italic">No activities logged yet.</p>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="pl-6 relative">
                    <div className="absolute w-3 h-3 bg-brand rounded-full -left-[1.5px] top-1.5 ring-4 ring-surface" />
                    <p className="text-sm text-textPrimary font-medium">{act.activity_type.replace('_', ' ')}</p>
                    <p className="text-xs text-textSecondary mt-1">{act.details}</p>
                    <time className="text-[10px] text-border font-mono mt-2 block">
                      {new Date(act.created_at).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CandidateDrawer;
