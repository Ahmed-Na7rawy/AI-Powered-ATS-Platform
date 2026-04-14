import React, { useState, useEffect } from 'react';
import { Plus, Briefcase, Building, ChevronRight } from 'lucide-react';
import api from '../services/api';
import JobEditor from '../components/Organization/JobEditor';

const Organization = () => {
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  
  const [editingJob, setEditingJob] = useState(null);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const [deptRes, jobRes] = await Promise.all([
        api.get('/hr/departments'),
        api.get('/hr/jobs')
      ]);
      setDepartments(deptRes.data);
      setJobs(jobRes.data);
      if (deptRes.data.length > 0 && !selectedDept) {
        setSelectedDept(deptRes.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load organization data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      const res = await api.post('/hr/departments', { name: newDeptName });
      setDepartments([...departments, res.data]);
      setNewDeptName('');
      setIsAddingDept(false);
      setSelectedDept(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to create department');
    }
  };

  const handleSaveJob = (savedJob) => {
    setJobs((prev) => {
      const exists = prev.find(j => j.id === savedJob.id);
      if (exists) return prev.map(j => j.id === savedJob.id ? savedJob : j);
      return [...prev, savedJob];
    });
    setEditingJob(null);
  };

  const departmentJobs = jobs.filter(j => selectedDept && j.department_id === selectedDept.id);

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Organization</h1>
          <p className="text-sm text-textSecondary">Manage your departments and open roles</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 text-danger border border-danger/30 rounded-lg text-sm shrink-0">
          {error}
        </div>
      )}

      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Left Pane - Departments */}
        <div className="w-1/3 min-w-[280px] flex flex-col glass-card border border-border p-0 overflow-hidden bg-black/40">
          <div className="p-4 border-b border-border/50 flex justify-between items-center bg-transparent shrink-0">
            <span className="font-semibold text-white flex items-center gap-2">
              <Building size={16} className="text-textSecondary" />
              Departments
            </span>
            <button 
              onClick={() => setIsAddingDept(true)}
              className="text-white hover:bg-white/10 p-1.5 rounded-md transition-colors"
              title="Add Department"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAddingDept && (
              <div className="p-3 border-b border-border/50 bg-white/5">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Department name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateDepartment()}
                  className="w-full bg-background border border-border rounded text-sm px-3 py-1.5 text-white outline-none focus:border-white transition-colors mb-2"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingDept(false)} className="text-xs text-textSecondary hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleCreateDepartment} className="text-xs text-black bg-white px-2 py-1 rounded font-medium hover:bg-gray-200 transition-colors">Save</button>
                </div>
              </div>
            )}

            {loading && !departments.length ? (
              <div className="p-6 text-center text-sm text-textSecondary">Loading...</div>
            ) : departments.length === 0 ? (
              <div className="p-6 text-center text-sm text-textSecondary italic">No departments yet.</div>
            ) : (
              <ul className="divide-y divide-border/30">
                {departments.map(dept => (
                  <li 
                    key={dept.id}
                    onClick={() => { setSelectedDept(dept); setEditingJob(null); }}
                    className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${selectedDept?.id === dept.id ? 'bg-white/10 border-l-2 border-white' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
                  >
                    <span className={`text-sm font-medium ${selectedDept?.id === dept.id ? 'text-white' : 'text-gray-300'}`}>
                      {dept.name}
                    </span>
                    <span className="text-xs text-textSecondary bg-background px-2 py-0.5 rounded-full border border-border/50">
                      {jobs.filter(j => j.department_id === dept.id).length} jobs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Pane - Jobs List or Job Editor */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {!selectedDept ? (
            <div className="flex-1 glass-card border border-border dashed flex flex-col items-center justify-center text-textSecondary">
              <Building size={32} className="mb-3 opacity-50" />
              <p>Select a department to view or manage jobs</p>
            </div>
          ) : editingJob ? (
            <JobEditor 
              job={editingJob.id ? editingJob : null}
              departmentId={selectedDept.id}
              onSave={handleSaveJob}
              onCancel={() => setEditingJob(null)}
            />
          ) : (
            <div className="flex flex-col h-full glass-card border border-border p-0 overflow-hidden bg-black/40">
              <div className="p-4 border-b border-border/50 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="font-semibold text-white">Jobs in {selectedDept.name}</h2>
                </div>
                <button 
                  onClick={() => setEditingJob({ department_id: selectedDept.id })}
                  className="flex items-center gap-1.5 text-xs font-medium text-black bg-white hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus size={14} /> Add Job
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {departmentJobs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-textSecondary border border-border/30 dashed rounded-lg">
                    <Briefcase size={24} className="mb-2 opacity-50" />
                    <p className="text-sm">No jobs listed in this department.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {departmentJobs.map(job => (
                      <div 
                        key={job.id} 
                        className="p-4 rounded-lg bg-surface border border-border/50 hover:border-white/30 cursor-pointer transition-all group flex items-start justify-between"
                        onClick={() => setEditingJob(job)}
                      >
                        <div>
                          <h3 className="text-white font-medium mb-1 group-hover:text-brand transition-colors">{job.title}</h3>
                          <p className="text-xs text-textSecondary line-clamp-2 pr-4">
                            {job.description || "No description provided."}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-textSecondary mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Organization;
