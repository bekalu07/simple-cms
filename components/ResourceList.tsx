import React, { useState } from 'react';
import { useSecurity } from '../App';
import { checkAccess } from '../services/securityService';
import { Resource, SecurityLevel, Department } from '../types';
import { FileText, Lock, Unlock, Eye, Users, ShieldAlert, Share2 } from 'lucide-react';

const ResourceList: React.FC = () => {
  const { resources, currentUser, config, addLog, updateResource, users } = useSecurity();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [accessResult, setAccessResult] = useState<{allowed: boolean, reason: string} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleAccess = (resource: Resource) => {
    if (!currentUser) return;
    const decision = checkAccess(currentUser, resource, config);
    
    // Log the attempt
    addLog(
        'ACCESS_RESOURCE', 
        decision.allowed ? 'SUCCESS' : 'DENIED', 
        decision.allowed ? 'Access granted' : decision.reason, 
        resource.id
    );

    setAccessResult(decision);
    if (decision.allowed) {
        setSelectedResource(resource);
    } else {
        setSelectedResource(null);
    }
  };

  const closeViewer = () => {
    setSelectedResource(null);
    setAccessResult(null);
  };

  const handleShare = (userIdToShare: string) => {
      if (selectedResource) {
          const updated = {
              ...selectedResource,
              sharedWith: [...selectedResource.sharedWith, userIdToShare]
          };
          updateResource(updated);
          setShowShareModal(false);
          addLog('DAC_SHARE', 'SUCCESS', `Resource shared with ${userIdToShare}`, selectedResource.id);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Sensitive Contacts & Files</h2>
         <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium flex items-center">
            <ShieldAlert size={12} className="mr-1" />
            Protected by Active Policies
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            {resources.map(resource => {
                const decision = currentUser ? checkAccess(currentUser, resource, config) : { allowed: false };
                // We show all resources, but blur/lock contents if denied, or maybe we show them as "Locked Item"
                // For this demo, let's list them but show lock status visually
                
                return (
                    <div key={resource.id} onClick={() => handleAccess(resource)} 
                        className={`group bg-white p-4 rounded-lg border shadow-sm transition-all cursor-pointer hover:shadow-md flex items-center justify-between
                        ${selectedResource?.id === resource.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg ${decision.allowed ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{resource.name}</h3>
                                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded ${getClassificationColor(resource.classification)} text-white font-bold`}>
                                        {SecurityLevel[resource.classification]}
                                    </span>
                                    <span>• {resource.department}</span>
                                    <span>• Owner: {users.find(u => u.id === resource.ownerId)?.username}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-slate-400">
                             {decision.allowed ? <Unlock className="text-emerald-500" /> : <Lock className="text-red-400" />}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Details / Viewer Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg h-fit min-h-[400px] flex flex-col relative overflow-hidden">
            {selectedResource ? (
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{selectedResource.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">{selectedResource.type}</p>
                        </div>
                        <button onClick={() => setShowShareModal(true)} title="Share (DAC)" className="p-2 hover:bg-slate-200 rounded-full text-indigo-600">
                            <Share2 size={18} />
                        </button>
                    </div>
                    <div className="p-8 flex-1 bg-white font-mono text-sm text-slate-700 leading-relaxed overflow-auto">
                        {/* Simulate Biometric Check visual before showing content? Maybe simple for now. */}
                        <div className="mb-4 text-xs text-slate-400 uppercase tracking-wider">Decrypted Content:</div>
                        {selectedResource.content}
                        
                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800">
                            Warning: This document is classified <strong>{SecurityLevel[selectedResource.classification]}</strong>. 
                            Access is logged. Do not distribute without authorization.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    {accessResult && !accessResult.allowed ? (
                        <div className="animate-pulse flex flex-col items-center">
                            <ShieldAlert size={48} className="text-red-500 mb-4" />
                            <h3 className="text-lg font-bold text-red-600 mb-2">Access Denied</h3>
                            <p className="text-sm max-w-xs mx-auto">{accessResult.reason}</p>
                        </div>
                    ) : (
                        <>
                            <Eye size={48} className="mb-4 opacity-50" />
                            <p>Select a file to decrypt and view.</p>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Simple Share Modal for DAC */}
      {showShareModal && selectedResource && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                  <h3 className="font-bold mb-4">Share "{selectedResource.name}"</h3>
                  <p className="text-xs text-slate-500 mb-4">Discretionary Access Control: Grant read access to another user.</p>
                  <div className="space-y-2">
                      {users.filter(u => u.id !== currentUser?.id && !selectedResource.sharedWith.includes(u.id)).map(u => (
                          <button key={u.id} onClick={() => handleShare(u.id)} className="w-full text-left p-2 hover:bg-indigo-50 rounded flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">{u.username[0]}</div>
                              <span className="text-sm">{u.fullName}</span>
                          </button>
                      ))}
                      {users.filter(u => u.id !== currentUser?.id && !selectedResource.sharedWith.includes(u.id)).length === 0 && (
                          <p className="text-sm text-slate-400 italic">No other users available to share with.</p>
                      )}
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="mt-4 w-full border p-2 rounded text-sm hover:bg-slate-50">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

const getClassificationColor = (level: SecurityLevel) => {
    switch (level) {
        case SecurityLevel.TOP_SECRET: return 'bg-red-600';
        case SecurityLevel.CONFIDENTIAL: return 'bg-orange-500';
        case SecurityLevel.INTERNAL: return 'bg-blue-500';
        default: return 'bg-slate-400';
    }
}

export default ResourceList;
