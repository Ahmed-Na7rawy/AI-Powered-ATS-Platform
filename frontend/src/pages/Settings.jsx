import React, { useState } from 'react';
import { Save, Building, Server, Users, UserPlus, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '',
    apiKey: '',
    geminiKey: ''
  });

  const [companyProfile, setCompanyProfile] = useState({
    name: '',
    website: '',
    support_email: ''
  });

  const [savingState, setSavingState] = useState({ smtp: false, company: false });
  const [savedStatus, setSavedStatus] = useState({ smtp: false, company: false });

  const [hrUsers, setHrUsers] = useState([]);
  const [isInviting, setIsInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteData, setInviteData] = useState({ email: '', password: '', is_admin: false, is_active: true });
  const [inviteError, setInviteError] = useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, usersRes] = await Promise.all([
          api.get('/hr/settings'),
          api.get('/hr/users')
        ]);
        
        setCompanyProfile({
          name: settingsRes.data.name || '',
          website: settingsRes.data.website || '',
          support_email: settingsRes.data.support_email || ''
        });
        
        setSmtpConfig({
          host: settingsRes.data.smtp_host || '',
          port: settingsRes.data.smtp_port || '',
          apiKey: settingsRes.data.smtp_password || '',
          geminiKey: settingsRes.data.gemini_api_key || ''
        });
        
        setHrUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to fetch settings/users', err);
      }
    };
    fetchData();
  }, []);

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingState(prev => ({ ...prev, smtp: true }));
    try {
      await api.put('/hr/settings', {
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
        smtp_password: smtpConfig.apiKey,
        gemini_api_key: smtpConfig.geminiKey
      });
      setSavedStatus(prev => ({ ...prev, smtp: true }));
      setTimeout(() => setSavedStatus(prev => ({ ...prev, smtp: false })), 3000);
    } catch (err) {
      console.error('Failed to save SMTP', err);
      alert('Failed to save SMTP config');
    } finally {
      setSavingState(prev => ({ ...prev, smtp: false }));
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingState(prev => ({ ...prev, company: true }));
    try {
      await api.put('/hr/settings', {
        name: companyProfile.name,
        website: companyProfile.website,
        support_email: companyProfile.support_email
      });
      setSavedStatus(prev => ({ ...prev, company: true }));
      setTimeout(() => setSavedStatus(prev => ({ ...prev, company: false })), 3000);
    } catch (err) {
      console.error('Failed to save Company profile', err);
      alert('Failed to save profile');
    } finally {
      setSavingState(prev => ({ ...prev, company: false }));
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      if (editingUser) {
        // Prepare update data - only include password if it's filled
        const updatePayload = {
          email: inviteData.email,
          is_admin: inviteData.is_admin,
          is_active: inviteData.is_active
        };
        if (inviteData.password) updatePayload.password = inviteData.password;
        
        await api.put(`/hr/users/${editingUser.id}`, updatePayload);
        setHrUsers(hrUsers.map(u => u.id === editingUser.id ? { ...u, ...updatePayload } : u));
      } else {
        const res = await api.post('/hr/users/invite', inviteData);
        setHrUsers([...hrUsers, res.data]);
      }
      setIsInviting(false);
      setEditingUser(null);
      setInviteData({ email: '', password: '', is_admin: false, is_active: true });
    } catch (err) {
      setInviteError(err.response?.data?.detail || 'Failed to save user');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/hr/users/${userId}`);
      setHrUsers(hrUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setInviteData({ email: u.email, password: '', is_admin: u.is_admin, is_active: u.is_active });
    setIsInviting(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-textSecondary mt-1 text-sm">Manage configuration, integrations, and access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company Profile Settings */}
        <div className="glass-card flex flex-col p-6 border border-border space-y-6">
           <div className="flex items-center gap-3 border-b border-border pb-4">
              <Building className="text-brand" />
              <h2 className="text-lg font-semibold text-white">Company Profile</h2>
           </div>
           
           <form onSubmit={handleSaveCompany} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-textSecondary mb-2">Company Name</label>
               <input
                 type="text"
                 value={companyProfile.name}
                 onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})}
                 className="input-field"
                 required
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-textSecondary mb-2">Website URL</label>
               <input
                 type="url"
                 value={companyProfile.website}
                 onChange={(e) => setCompanyProfile({...companyProfile, website: e.target.value})}
                 className="input-field"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-textSecondary mb-2">HR Support Email</label>
               <input
                 type="email"
                 value={companyProfile.support_email}
                 onChange={(e) => setCompanyProfile({...companyProfile, support_email: e.target.value})}
                 className="input-field"
               />
             </div>

             <div className="pt-2 flex items-center justify-between">
                {savedStatus.company ? (
                  <span className="text-sm text-green-400 font-medium">Saved Successfully!</span>
                ) : <span/>}
                <button type="submit" disabled={savingState.company} className="btn-primary w-32 flex justify-center">
                  {savingState.company ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <span>Update Profile</span>}
                </button>
             </div>
           </form>
        </div>

        {/* SMTP Configuration */}
        <div className="glass-card flex flex-col p-6 border border-border space-y-6">
           <div className="flex items-center gap-3 border-b border-border pb-4">
              <Server className="text-brand" />
              <h2 className="text-lg font-semibold text-white">SMTP Configuration</h2>
           </div>
           <p className="text-xs text-textSecondary -mt-2">Required for dispatching templates from the Background Queue.</p>
           
           <form onSubmit={handleSaveSmtp} className="space-y-4">
             <div className="flex gap-4">
               <div className="flex-1">
                 <label className="block text-sm font-medium text-textSecondary mb-2">SMTP Host</label>
                 <input
                   type="text"
                   value={smtpConfig.host}
                   onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                   className="input-field"
                   required
                 />
               </div>
               <div className="w-24">
                 <label className="block text-sm font-medium text-textSecondary mb-2">Port</label>
                 <input
                   type="number"
                   value={smtpConfig.port}
                   onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                   className="input-field"
                   required
                 />
               </div>
             </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">API Key / Password (SMTP)</label>
                <input
                  type="password"
                  value={smtpConfig.apiKey}
                  onChange={(e) => setSmtpConfig({...smtpConfig, apiKey: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-textSecondary mb-2 flex items-center gap-2">
                   <Cpu size={16} className="text-brand"/> Gemini AI API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={smtpConfig.geminiKey}
                  onChange={(e) => setSmtpConfig({...smtpConfig, geminiKey: e.target.value})}
                  className="input-field"
                />
                <p className="text-[10px] text-textSecondary mt-1 italic">Providing a company-specific key overrides the platform default.</p>
              </div>

             <div className="pt-2 flex items-center justify-between">
                {savedStatus.smtp ? (
                  <span className="text-sm text-green-400 font-medium">Saved Successfully!</span>
                ) : <span/>}
                <button type="submit" disabled={savingState.smtp} className="btn-primary w-32 flex justify-center">
                  {savingState.smtp ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <span>Save Config</span>}
                </button>
             </div>
           </form>
        </div>

      </div>

      {/* HR Users Management */}
      <div className="glass-card border border-border mt-8 p-0 overflow-hidden">
         <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
            <div className="flex items-center gap-3 text-white">
               <Users className="text-brand" />
               <h2 className="text-lg font-semibold">User Management</h2>
            </div>
            <button 
              onClick={() => {
                setEditingUser(null);
                setInviteData({ email: '', password: '', is_admin: false, is_active: true });
                setIsInviting(true);
              }}
              className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-sm border-brand/50 text-brand"
            >
               <UserPlus size={16} /> Invite User
            </button>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-textSecondary">
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-surface/30">
                 {hrUsers.map(u => (
                   <tr key={u.id}>
                      <td className="p-4 text-white font-medium">{u.email}</td>
                       <td className="p-4">
                          <span className={`${u.is_active ? 'text-green-400' : 'text-danger'} text-xs font-semibold`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                       </td>
                       <td className="p-4">
                          <span className="bg-brand/20 text-brand border border-brand/30 px-2 py-1 rounded text-xs">
                            {u.is_admin ? 'Admin' : 'Recruiter'}
                          </span>
                       </td>
                       <td className="p-4 text-right flex justify-end gap-3">
                          <button 
                            onClick={() => openEditModal(u)}
                            className="text-sm text-textSecondary hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          {u.id !== user?.id && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-sm text-danger hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                       </td>
                   </tr>
                 ))}
              </tbody>
            </table>
         </div>
      </div>
      
      {/* Invite Modal */}
       {isInviting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingUser ? 'Edit User' : 'Invite New User'}
              </h2>
              
              {inviteError && (
                <div className="mb-4 p-3 bg-danger/10 text-danger border border-danger/30 rounded text-sm">
                  {inviteError}
                </div>
              )}
              
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-textSecondary mb-2">Email Address</label>
                   <input
                     type="email"
                     value={inviteData.email}
                     onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                     className="input-field w-full"
                     required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-textSecondary mb-2">
                     {editingUser ? 'New Password (leave blank to keep)' : 'Temporary Password'}
                   </label>
                   <input
                     type="text"
                     placeholder={editingUser ? "••••••••" : ""}
                     value={inviteData.password}
                     onChange={(e) => setInviteData({...inviteData, password: e.target.value})}
                     className="input-field w-full"
                     required={!editingUser}
                   />
                </div>
                 <div className="flex items-center gap-2 mt-2">
                   <input
                     type="checkbox"
                     id="isAdmin"
                     checked={inviteData.is_admin}
                     onChange={(e) => setInviteData({...inviteData, is_admin: e.target.checked})}
                     className="w-4 h-4 rounded border-border bg-background text-brand focus:ring-brand focus:ring-offset-background"
                   />
                   <label htmlFor="isAdmin" className="text-sm text-textSecondary">Grant Admin Privileges?</label>
                </div>

                {editingUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={inviteData.is_active}
                      onChange={(e) => setInviteData({...inviteData, is_active: e.target.checked})}
                      className="w-4 h-4 rounded border-border bg-background text-brand focus:ring-brand focus:ring-offset-background"
                    />
                    <label htmlFor="isActive" className="text-sm text-textSecondary">Account Active?</label>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsInviting(false)} className="px-4 py-2 text-sm text-textSecondary hover:text-white transition-colors">
                     Cancel
                   </button>
                    <button type="submit" className="btn-primary">
                      {editingUser ? 'Save Changes' : 'Send Invite'}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
