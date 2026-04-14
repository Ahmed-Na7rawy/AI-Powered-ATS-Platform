import React, { useState } from 'react';
import { Mail, Clock, RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';

import api from '../services/api';

const EmailQueue = () => {
  const [queue, setQueue] = useState([]);
  const [retrying, setRetrying] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/queue/');
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchQueue();
  }, []);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await api.post(`/hr/queue/${id}/retry`);
      fetchQueue();
    } catch (error) {
      console.error('Retry failed', error);
      alert('Failed to retry email.');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return <span className="status-badge status-hired flex items-center gap-1 w-max"><CheckCircle size={14}/> Sent</span>;
      case 'PENDING':
        return <span className="status-badge status-reviewing flex items-center gap-1 w-max"><Clock size={14}/> Pending</span>;
      case 'FAILED':
        return <span className="status-badge status-rejected flex items-center gap-1 w-max"><AlertCircle size={14}/> Failed</span>;
      default:
        return <span className="status-badge text-gray-500 bg-gray-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Mail className="text-brand" /> Email Dispatch Queue
          </h1>
          <p className="text-textSecondary mt-1 text-sm">Monitor background tasks and delivery statuses</p>
        </div>
      </div>

      <div className="glass-card shadow-lg p-0 overflow-hidden border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-textSecondary">
              <th className="p-4 font-semibold">Recipient</th>
              <th className="p-4 font-semibold">Template</th>
              <th className="p-4 font-semibold">Scheduled Time</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {queue.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-textSecondary">The queue is currently empty.</td></tr>
            ) : (
              queue.map((task) => (
                <tr key={task.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-4">
                     <span className="font-medium text-white">{task.recipient}</span>
                  </td>
                  <td className="p-4 text-sm text-textSecondary font-mono bg-background/50 rounded inline-flex mt-3 ml-4 px-2 py-1">
                     {task.template_key}
                  </td>
                  <td className="p-4 text-sm text-textSecondary">
                    {new Date(task.scheduled_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(task.status)}
                  </td>
                  <td className="p-4 text-right">
                    {task.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(task.id)}
                        disabled={retrying === task.id}
                        className="p-2 border border-brand/30 bg-brand/10 text-brand hover:text-white hover:bg-brand rounded-lg transition-colors inline-flex items-center"
                        title="Retry Failed Notification"
                      >
                        <RefreshCcw size={16} className={retrying === task.id ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailQueue;
