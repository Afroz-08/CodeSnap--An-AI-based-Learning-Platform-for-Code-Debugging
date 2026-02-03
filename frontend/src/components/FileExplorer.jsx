import React, { useState, useRef } from 'react';
import { FileText, Folder, Upload, FolderOpen, FilePlus, FolderPlus } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';

const getFileIcon = (language) => {
  switch (language) {
    case 'python': return '🐍';
    case 'javascript': return '🟨';
    case 'java': return '☕';
    case 'c': return '⚙️';
    default: return '📄';
  }
};

const getExtensionFromLanguage = (language) => {
  switch (language) {
    case 'python': return 'py';
    case 'javascript': return 'js';
    case 'java': return 'java';
    case 'c': return 'c';
    default: return 'txt';
  }
};

export default function FileExplorer() {
  const {
    workspace,
    currentFile,
    language,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    openFile,
    importFile,
    exportFile,
    getOrganizedFiles
  } = useWorkspace();

  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const fileInputRef = useRef(null);

  const { rootFiles, folders } = getOrganizedFiles();

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const startEditing = (item, type) => {
    setEditingItem({ ...item, type });
    setNewItemName(item.name);
  };

  const finishEditing = () => {
    if (!editingItem || !newItemName.trim()) {
      setEditingItem(null);
      setNewItemName('');
      return;
    }

    if (editingItem.type === 'file') {
      renameFile(editingItem.id, newItemName.trim());
    } else {
      renameFolder(editingItem.id, newItemName.trim());
    }

    setEditingItem(null);
    setNewItemName('');
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setNewItemName('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importFile(file);
      } catch (error) {
        alert('Failed to import file: ' + error.message);
      }
    }
    // Reset input
    event.target.value = '';
  };

  const renderFile = (file) => {
    const isActive = currentFile?.id === file.id;
    const isEditing = editingItem?.id === file.id && editingItem?.type === 'file';

    return (
      <div
        key={file.id}
        className={`group flex items-center px-2 py-1 mx-1 rounded cursor-pointer hover:bg-gray-700 ${
          isActive ? 'bg-purple-600 text-white' : 'text-gray-300'
        }`}
        onClick={() => !isEditing && openFile(file)}
        onDoubleClick={() => startEditing(file, 'file')}
      >
        <span className="mr-2 text-sm">
          <FileText className="w-4 h-4 text-gray-400" />
        </span>

        {isEditing ? (
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-gray-600 text-white text-sm px-1 py-0.5 rounded outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate" title={file.name}>
            {file.name}
          </span>
        )}

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportFile(file.id);
              }}
              className="text-xs text-gray-400 hover:text-white p-1"
              title="Export file"
            >
              ⬇️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${file.name}"?`)) {
                  deleteFile(file.id);
                }
              }}
              className="text-xs text-gray-400 hover:text-red-400 p-1"
              title="Delete file"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folder) => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderFiles = workspace.files.filter(f => f.folderId === folder.id);
    const isEditing = editingItem?.id === folder.id && editingItem?.type === 'folder';

    return (
      <div key={folder.id}>
        <div
          className="group flex items-center px-2 py-1 mx-1 rounded cursor-pointer hover:bg-gray-700 text-gray-300"
          onClick={() => !isEditing && toggleFolder(folder.id)}
          onDoubleClick={() => startEditing(folder, 'folder')}
        >
          <span className="mr-2 text-sm">
            {isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
          </span>

          {isEditing ? (
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-gray-600 text-white text-sm px-1 py-0.5 rounded outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate" title={folder.name}>
              {folder.name}
            </span>
          )}

          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = `file${folderFiles.length + 1}.${getExtensionFromLanguage(language)}`;
                  createFile(newName, folder.id);
                }}
                className="text-xs text-gray-400 hover:text-green-400 p-1"
                title="New file in folder"
              >
                ➕
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete folder "${folder.name}" and all its contents?`)) {
                    deleteFolder(folder.id);
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-400 p-1"
                title="Delete folder"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="ml-4">
            {folderFiles.map(renderFile)}
            {folderFiles.length === 0 && (
              <div className="text-xs text-gray-500 px-2 py-1 mx-1 italic">
                (empty folder)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
          <Folder className="w-4 h-4 mr-2 text-blue-400" />
          Learning Workspace
        </h3>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => createFile(`file${rootFiles.length + 1}.${getExtensionFromLanguage(language)}`)}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            title="Create new file"
          >
            <FilePlus className="w-4 h-4" />
            New File
          </button>

          <button
            onClick={() => createFolder(`Folder${folders.length + 1}`)}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            title="Create new folder"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            title="Import file from your computer"
          >
            <Upload className="w-4 h-4" />
            Import File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.js,.java,.c,.txt"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {/* Root Files */}
        {rootFiles.map(renderFile)}

        {/* Folders */}
        {folders.map(renderFolder)}

        {/* Empty State */}
        {rootFiles.length === 0 && folders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📂</div>
            <div className="text-sm">Your workspace is empty</div>
            <div className="text-xs mt-1">Create a file or folder to get started!</div>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Files: {workspace.files.length}</span>
          <span>Folders: {workspace.folders.length}</span>
        </div>
      </div>
    </div>
  );
}