import React, { useState } from 'react';
import { Sparkles, Save, Eye, Edit3 } from 'lucide-react';
import api from '../../services/api';

const Editor = ({ template, onSave }) => {
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContextType, setAiContextType] = useState('rejection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Variable Helpers
  const insertVariable = (variable) => {
    setBody((prev) => prev + ` {${variable}}`);
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await api.post('/ai/generate-template', {
        type: aiContextType,
        context: aiPrompt
      });
      setBody(res.data.content);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (err) {
      console.error('Failed to generate template', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Replace variable placeholders with realistic data for preview pane
  const renderPreview = (text) => {
    return text
      .replace(/{name}/g, 'Jane Doe')
      .replace(/{job_title}/g, 'Senior Software Engineer')
      .replace(/{company_name}/g, 'Acme Corp Demo');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
      
      {/* Editor Section */}
      <div className="flex-1 flex flex-col glass-card border border-border p-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="bg-surface border-b border-border p-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-textSecondary font-medium">Insert:</span>
            {['name', 'job_title', 'company_name'].map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="px-2 py-1 bg-background border border-border text-xs text-brand hover:bg-brand/10 hover:border-brand/50 rounded transition-colors"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowAiModal(!showAiModal)}
            className="flex items-center gap-2 text-sm text-white font-medium bg-gradient-to-r from-brand to-purple-500 hover:from-brandHover hover:to-purple-400 px-4 py-2 rounded-lg shadow-lg transition-transform hover:scale-[1.02]"
          >
            <Sparkles size={16} /> AI Generate
          </button>
        </div>

        {/* AI Input Dropdown Panel */}
        {showAiModal && (
          <div className="bg-background border-b border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-semibold text-brand flex items-center gap-2"><Sparkles size={16}/> Template Generation Context</h3>
            </div>
            <div className="flex gap-4">
               <div className="w-1/3">
                  <label className="block text-xs text-textSecondary mb-1">Template Type</label>
                  <select 
                    value={aiContextType} 
                    onChange={(e) => setAiContextType(e.target.value)}
                    className="w-full input-field text-sm py-1.5"
                  >
                    <option value="applied_thanks">Application Received</option>
                    <option value="followup">Follow up</option>
                    <option value="rejection">Rejection</option>
                    <option value="interview_invite">Interview Invite</option>
                  </select>
               </div>
               <div className="flex-1">
                 <label className="block text-xs text-textSecondary mb-1">Extra Context / Tone</label>
                 <input 
                   type="text" 
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   className="w-full input-field text-sm py-1.5"
                   placeholder="e.g. Keep it extremely brief but encouraging"
                 />
               </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
              >
                {isGenerating ? <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent" /> : "Generate Now"}
              </button>
            </div>
          </div>
        )}

        {/* Editor Inputs */}
        <div className="flex flex-col flex-1 p-4 gap-4 bg-background">
          <div>
             <input
               type="text"
               value={subject}
               onChange={(e) => setSubject(e.target.value)}
               className="w-full input-field font-semibold text-lg"
               placeholder="Email Subject..."
             />
          </div>
          
          <div className="flex-1 relative">
             {isGenerating && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border border-brand/50 rounded-lg animate-pulse">
                   <div className="text-brand font-medium flex items-center gap-3">
                     <div className="animate-spin h-5 w-5 border-2 border-brand rounded-full border-t-transparent" />
                     Gemini is writing...
                   </div>
                </div>
             )}
             <textarea
               value={body}
               onChange={(e) => setBody(e.target.value)}
               className="w-full h-full min-h-[300px] input-field resize-none leading-relaxed"
               placeholder="Write your template here or let AI generate it..."
             />
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => onSave({ ...template, subject, body })}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} /> Save Template
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="flex-1 flex flex-col glass-card border border-border p-0 overflow-hidden">
        <div className="bg-surface border-b border-border p-4 flex gap-2 items-center text-textSecondary font-medium text-sm">
           <Eye size={16} /> Live Preview
        </div>
        
        <div className="flex-1 p-6 bg-white text-black overflow-y-auto">
           <div className="border-b border-gray-200 pb-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">Subject:</p>
              <h2 className="text-lg font-bold">{subject ? renderPreview(subject) : "(No Subject)"}</h2>
           </div>
           
           <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                 {body ? renderPreview(body) : "(No Content)"}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
