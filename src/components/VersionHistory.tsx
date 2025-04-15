import React from 'react';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import type { DocumentVersion } from '../types';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
  loading: boolean;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  onRestore,
  loading,
}) => {
  if (loading) {
    return <div className="text-center p-4">Loading version history...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Version History</h3>
      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
          >
            <div>
              <div className="text-sm text-gray-500">
                {format(new Date(version.created_at), 'PPp')}
              </div>
              <div className="mt-1 text-sm">
                {version.metadata.source && (
                  <span className="text-gray-500">
                    Source: {version.metadata.source}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRestore(version)}
              className="flex items-center space-x-2 px-3 py-1 text-blue-500 hover:text-blue-600"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};