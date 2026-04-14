import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { UploadCloud, CheckCircle } from 'lucide-react';
import axios from 'axios';

// Bypass Interceptors for public Apply page
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

const Apply = () => {
  const { token } = useParams();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  
  const [jobDetails, setJobDetails] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/api/apply/${token}`);
        setJobDetails(res.data);
      } catch (err) {
        console.error(err);
        setPageError(err?.response?.data?.detail || 'Invalid or expired application link.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please attach your resume');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('resume', file);
    
    try {
      await api.post(`/api/apply/${token}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Failed to submit application. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 flex flex-col items-center max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-brand/20 text-brand rounded-full flex items-center justify-center mb-2">
             <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Application Received!</h1>
          <p className="text-textSecondary text-sm">
            Thank you for applying. Your profile is successfully in our system and you will hear back from the hiring team shortly.
          </p>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 flex flex-col items-center max-w-md w-full text-center space-y-4 border-danger/30">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-2">
             <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-white">Link Unavailable</h1>
          <p className="text-textSecondary text-sm">{pageError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-8">
        
        {/* Job Info Pane */}
        <div className="flex-1 space-y-6">
           <div className="glass-card p-8 h-full bg-surface/50 border border-border flex flex-col">
              <div className="mb-6">
                 <div className="text-brand text-xs font-bold uppercase tracking-wider mb-2">{jobDetails?.company_name}</div>
                 <h1 className="text-3xl font-bold text-white tracking-tight">{jobDetails?.job_title}</h1>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                 <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">About the Role</h3>
                    <div className="text-textSecondary text-sm leading-relaxed whitespace-pre-wrap">
                      {jobDetails?.job_description || "No description provided."}
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Requirements</h3>
                    <div className="text-textSecondary text-sm leading-relaxed whitespace-pre-wrap">
                      {jobDetails?.job_requirements || "No specific requirements listed."}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Application Form Pane */}
        <div className="w-full md:w-[480px]">
           <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 bg-surface/80">
              <div className="mb-2">
                 <h2 className="text-2xl font-bold text-white tracking-tight">Apply Now</h2>
                 <p className="text-textSecondary text-sm mt-1">Submit your details to apply for this role.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-textSecondary mb-2">First Name</label>
                   <input
                     type="text"
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                     className="w-full bg-background border border-border/80 rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-textSecondary mb-2">Last Name</label>
                   <input
                     type="text"
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                     className="w-full bg-background border border-border/80 rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors"
                     required
                   />
                 </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-textSecondary mb-2">Email Address</label>
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-background border border-border/80 rounded-md px-3 py-2 text-white outline-none focus:border-brand transition-colors"
                   required
                 />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-textSecondary mb-2">Resume (PDF or DOCX)</label>
                 <div className="relative border-2 border-dashed border-border hover:border-brand/50 rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-background">
                    <UploadCloud size={32} className="text-brand mb-2" />
                    <p className="text-sm text-textPrimary font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-textSecondary mt-1">PDF or DOCX up to 10MB</p>
                    <input 
                       type="file" 
                       className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                       accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                       onChange={(e) => setFile(e.target.files[0])}
                    />
                 </div>
                 {file && <p className="text-sm text-brand mt-2 font-medium truncate">Selected: {file.name}</p>}
              </div>
              
              {error && <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm">{error}</div>}
              
              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
              >
                 {loading ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : "Submit Application"}
              </button>
           </form>
        </div>
        
      </div>
    </div>
  );
};

export default Apply;
