import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Save } from 'lucide-react';
import type { Document } from '../types';

interface DocumentEditorProps {
  document: Document;
  onSave: (content: string) => Promise<void>;
  saving: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onSave,
  saving,
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: document.content,
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] px-4 py-2',
      },
    },
  });

  useEffect(() => {
    if (editor && document.content !== editor.getHTML()) {
      editor.commands.setContent(document.content);
    }
  }, [document.content, editor]);

  const handleSave = async () => {
    if (editor) {
      await onSave(editor.getHTML());
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${
              editor.isActive('bold') ? 'bg-gray-100' : ''
            }`}
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${
              editor.isActive('italic') ? 'bg-gray-100' : ''
            }`}
          >
            <Italic className="w-5 h-5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${
              editor.isActive('bulletList') ? 'bg-gray-100' : ''
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                     hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};