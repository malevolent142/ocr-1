import React from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Clock, Search } from 'lucide-react';
import type { Document, DocumentListParams } from '../types';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onViewHistory: (doc: Document) => void;
  listParams: DocumentListParams;
  onParamsChange: (params: Partial<DocumentListParams>) => void;
  totalPages: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  onEdit,
  onDelete,
  onViewHistory,
  listParams,
  onParamsChange,
  totalPages,
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={listParams.search || ''}
            onChange={(e) => onParamsChange({ search: e.target.value })}
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2"
          value={listParams.sortBy}
          onChange={(e) => onParamsChange({ sortBy: e.target.value as any })}
        >
          <option value="updated_at">Last Modified</option>
          <option value="created_at">Created Date</option>
          <option value="title">Title</option>
        </select>
        <select
          className="border rounded-lg px-4 py-2"
          value={listParams.sortOrder}
          onChange={(e) => onParamsChange({ sortOrder: e.target.value as any })}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documents found</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Last modified: {format(new Date(doc.updated_at), 'PPp')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewHistory(doc)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View History"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(doc)}
                    className="p-2 text-blue-400 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(doc)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {documents.length} of {totalPages * listParams.perPage} documents
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            disabled={listParams.page === 1}
            onClick={() => onParamsChange({ page: listParams.page - 1 })}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            disabled={listParams.page === totalPages}
            onClick={() => onParamsChange({ page: listParams.page + 1 })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};