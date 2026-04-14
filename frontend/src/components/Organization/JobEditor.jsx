import React, { useState } from 'react';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

const JobEditor = ({ job, departmentId, onSave, onCancel }) => {
  const [title, setTitle] = useState(job ? job.title : '');
  const [description, setDescription] = useState(job ? job.description || '' : '');
  const [requirements, setRequirements] = useState(job ? job.requirements || '' : '');
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Job title is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = { title, description, requirements, department_id: departmentId };
      let updatedJob;
      if (job) {
        const res = await api.put(`/hr/jobs/${job.id}`, payload);
        updatedJob = res.data;
      } else {
        const res = await api.post('/hr/jobs', payload);
        updatedJob = res.data;
      }
      onSave(updatedJob);
    } catch (err) {
      console.error(err);
      setError('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const refineRequirementsWithAI = async () => {
    if (!description.trim()) {
      setError('Please provide a job description first so the AI has context.');
      return;
    }
    setAiLoading(true);
    setError('');
    
    try {
      // Combining description and existing requirements to give AI full context
      const jdContent = `Description:\n${description}\n\nCurrent Requirements:\n${requirements}`;
      const res = await api.post('/ai/improve-jd', { job_description: jdContent });
      setRequirements(res.data.content);
    } catch (err) {
      console.error(err);
      setError('Failed to refine requirements using AI.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface glass-card border border-border p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">{job ? 'Edit Job' : 'New Job'}</h2>
      </div>

      {error && <div className="mb-4 p-3 bg-danger/10 text-danger border border-danger/30 rounded-lg text-sm">{error}</div>}

      <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">Job Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors resize-none"
            placeholder="Describe the role and responsibilities..."
          />
        </div>

        <div className="flex-1 flex flex-col min-h-[200px]">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-textSecondary">Requirements</label>
            <button 
              onClick={refineRequirementsWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs font-medium bg-brand/10 text-brand hover:bg-brand/20 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Refine with AI
            </button>
          </div>
          <div className="relative flex-1 flex flex-col">
            {aiLoading ? (
              <div className="absolute inset-0 bg-background/50 rounded-md border border-border flex items-center justify-center backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-brand" />
                  <span className="text-sm text-brand animate-pulse">Polishing criteria...</span>
                </div>
              </div>
            ) : null}
            <textarea 
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="flex-1 w-full bg-background border border-border rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors resize-none"
              placeholder="List required skills and qualifications..."
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 shrink-0">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-surface text-white transition-colors"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Job
        </button>
      </div>
    </div>
  );
};

export default JobEditor;
