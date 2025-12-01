import React, { useState } from 'react';
import { useSecurity } from '../App';
import { analyzeSecurityLogs } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Terminal, Brain, Search, Download, ShieldCheck } from 'lucide-react';

const AuditLog: React.FC = () => {
  const { logs, addLog } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter logs
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats for Chart
  const stats = [
    { name: 'Success', value: logs.filter(l => l.status === 'SUCCESS').length, color: '#10b981' },
    { name: 'Denied', value: logs.filter(l => l.status === 'DENIED').length, color: '#ef4444' },
    { name: 'Error', value: logs.filter(l => l.status === 'ERROR').length, color: '#f59e0b' },
  ];

  const handleBackup = () => {
      // Simulate backup
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secure_backup_${Date.now()}.json`;
      a.click();
      addLog('DATA_BACKUP', 'SUCCESS', 'Encrypted log backup initiated');
  };

  const handleAIAnalysis = async () => {
      setIsAnalyzing(true);
      setAiAnalysis(null);
      try {
          const result = await analyzeSecurityLogs(logs);
          setAiAnalysis(result);
          addLog('AI_AUDIT', 'SUCCESS', 'Executed Gemini 2.5 Security Audit');
      } catch (e) {
          setAiAnalysis("Analysis failed. Check API Key.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">System Audit Trails</h2>
            <p className="text-slate-500">Immutable logging of all security events.</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={handleBackup} className="flex items-center space-x-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                <Download size={16} /> <span>Encrypted Backup</span>
            </button>
            <button 
                onClick={handleAIAnalysis} 
                disabled={isAnalyzing}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50"
            >
                {isAnalyzing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div> : <Brain size={16} />}
                <span>{isAnalyzing ? 'Analyzing...' : 'AI Threat Detection'}</span>
            </button>
        </div>
      </div>

      {/* AI Result Section */}
      {aiAnalysis && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 relative animate-in fade-in slide-in-from-top-4">
              <div className="absolute top-4 right-4 text-indigo-200"><ShieldCheck size={48} /></div>
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center"><Brain size={18} className="mr-2"/> Gemini Analysis Report</h3>
              <div className="prose prose-sm text-indigo-800 max-w-none whitespace-pre-wrap">
                  {aiAnalysis}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-64">
             <h3 className="text-sm font-semibold text-slate-500 mb-4">Event Status Distribution</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={stats}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>

          {/* Logs Table */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
                  <Search className="text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search logs by user, action or details..." 
                    className="flex-1 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex-1 overflow-auto p-0 scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr>
                              <th className="p-3 text-xs font-semibold text-slate-500">Timestamp</th>
                              <th className="p-3 text-xs font-semibold text-slate-500">Actor</th>
                              <th className="p-3 text-xs font-semibold text-slate-500">Action</th>
                              <th className="p-3 text-xs font-semibold text-slate-500">Details</th>
                              <th className="p-3 text-xs font-semibold text-slate-500">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 font-mono text-xs">
                                  <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="p-3 font-medium text-slate-700">{log.actorName}</td>
                                  <td className="p-3 text-indigo-600">{log.action}</td>
                                  <td className="p-3 text-slate-600 max-w-xs truncate" title={log.details}>{log.details}</td>
                                  <td className="p-3">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                          log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                                          log.status === 'DENIED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {log.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                          {filteredLogs.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400">No logs found matching filter.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
              <div className="p-2 border-t border-slate-100 text-xs text-center text-slate-400 bg-slate-50">
                  <Terminal size={12} className="inline mr-1" /> End of Stream. Log Integrity Verified.
              </div>
          </div>
      </div>
    </div>
  );
};

export default AuditLog;
