import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import noteContext from '../../context/notes/NoteContext';
import AddNote from "../AddNote";
import NoteItem from "../NoteItem";
import AnalyticsModal from "../NoteItemComponents/AnalyticsModal";
import { CircularProgress } from "@mui/material";
import { ReactTyped as Typed } from "react-typed";
import {
  FaSearch,
  FaExpand,
  FaCompress,
  FaTrash,
  FaDownload,
  FaFolderPlus,
  FaFolder,
  FaFolderOpen,
  FaTimes,
  FaChevronDown,
  FaChartBar,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@tinymce/tinymce-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const Dashboard = ({ showAlert }) => {
  const context = useContext(noteContext);
  const { notes, getNotes, editNote, bulkDeleteNotes, folders, addFolder, deleteFolder, updateFolder, moveFolder, moveNotesToFolder, loading } = context;
  const navigate = useNavigate();

  // Local state
  const [note, setNote] = useState({ id: "", title: "", description: "", tag: "" });
  const [filterTag, setFilterTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [customFolder, setCustomFolder] = useState("");
  const [showFolderOptions, setShowFolderOptions] = useState(false);
  const [editFolderId, setEditFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";

  // Get notes
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else {
      getNotes();
    }
  }, []);

  // Fetch analytics data when analytics modal is opened
  useEffect(() => {
    if (showAnalyticsModal && selectedNotes.length > 0) {
      const fetchAnalytics = async () => {
        try {
          const token = localStorage.getItem("token");
          const analyticsPromises = selectedNotes.map(async (noteId) => {
            const response = await fetch(`${API_BASE}/api/notes/analytics/${noteId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "auth-token": token,
              },
            });
            const json = await response.json();
            if (response.ok) {
              const note = notes.find((n) => n.uid === noteId);
              return { noteId, title: note?.title || "Untitled Note", ...json };
            } else {
              throw new Error(`Failed to fetch analytics for note ${noteId}`);
            }
          });
          const results = await Promise.all(analyticsPromises);
          setAnalyticsData(results);
        } catch (error) {
          console.error("Error fetching analytics:", error);
          showAlert("Failed to fetch analytics", "error");
          setShowAnalyticsModal(false);
        }
      };
      fetchAnalytics();
    }
  }, [showAnalyticsModal, selectedNotes, notes, showAlert]);

  // Handle full-screen toggle
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Error exiting full-screen: ${err.message}`);
      });
    }
    setIsFullScreen(!isFullScreen);
  };

  // Listen for full-screen change
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Update note from NoteItem
  const updateNote = (currentNote) => {
    if (!currentNote || !currentNote.uid) {
      showAlert("Invalid note selected", "error");
      return;
    }
    setIsModalOpen(true);
    setNote({
      id: currentNote.uid,
      title: currentNote.title || "",
      description: currentNote.description || "",
      tag: currentNote.tag || "",
    });
  };

  // Handle note update in modal
  const handleClick = async (e) => {
    e.preventDefault();
    if (!note.id) {
      showAlert("No note selected for editing", "error");
      setIsModalOpen(false);
      return;
    }
    const success = await editNote(note.id, note.title, note.description, note.tag);
    if (success) {
      showAlert("Note updated successfully", "success");
    } else {
      showAlert("Note updated successfully", "success");
    }
    setIsModalOpen(false);
    setNote({ id: "", title: "", description: "", tag: "" });
  };

  // Handle TinyMCE editor change
  const handleEditorChange = (content) => {
    setNote((prev) => ({ ...prev, description: content }));
  };

  // Handle input change in modal fields
  const onChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value });
  };

  // Handle tag filter change
  const handleFilterChange = (e) => {
    setFilterTag(e.target.value);
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Handle note selection
  const handleNoteSelection = (noteId) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  // Handle select all notes
  const handleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredNotes.map((note) => note.uid));
    }
  };

  // Handle delete selected notes
  const handleDeleteSelected = async () => {
    if (selectedNotes.length === 0) {
      showAlert("Please select at least one note to delete", "warning");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedNotes.length} note(s)?`)) {
      const success = await bulkDeleteNotes(selectedNotes);
      if (success) {
        showAlert("Selected notes deleted successfully", "success");
        setSelectedNotes([]);
      } else {
        showAlert("Failed to delete notes", "error");
      }
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    if (selectedNotes.length === 0) {
      showAlert("Please select at least one note to download", "warning");
      return;
    }
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const selectedNoteObjects = notes.filter((note) => selectedNotes.includes(note.uid));

      for (const note of selectedNoteObjects) {
        const noteTitle = note.title || "Untitled_Note";
        const plainDescription = note.description
          ? note.description.replace(/<[^>]+>/g, "").replace(/[\r\n]+/g, "\n")
          : "No Description";
        const text = `
ApniNoteBook Note Export
======================
Title: ${noteTitle}
Created on: ${note.date ? new Date(note.date).toLocaleDateString() : "Not Available"}
Tags: ${Array.isArray(note.tags) ? note.tags.join(", ") : "General"}
Priority: ${note.priority || "low"}
Due Date: ${note.dueDate || "Not Set"}
Exported on: ${new Date().toLocaleString()}
======================
Description:
${plainDescription}
======================
Images:
${note.images?.length ? note.images.join("\n") : "None"}
======================
© ${new Date().getFullYear()} ApniNoteBook
        `.trim();
        zip.file(`${noteTitle.replace(/[^a-z0-9]/gi, "_")}.txt`, text);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "ApniNoteBook_Notes.zip");
      showAlert(`Downloaded ${selectedNotes.length} note(s) as ZIP`, "success");
    } catch (error) {
      console.error("Bulk download error:", error);
      showAlert("Failed to download notes", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!customFolder.trim()) {
      showAlert("Please enter a folder name", "warning");
      return;
    }
    try {
      const success = await addFolder(customFolder.trim());
      if (success) {
        showAlert(`Folder "${customFolder}" created`, "success");
        setCustomFolder("");
        setShowFolderOptions(false);
      } else {
        showAlert("Failed to create folder. A folder with this name may already exist.", "error");
      }
    } catch (error) {
      console.error("Folder creation error:", error);
      showAlert("Failed to create folder", "error");
    }
  };

  // Handle delete folder
  const handleDeleteFolder = async (folderId) => {
    if (window.confirm(`Are you sure you want to delete the folder and all its contents?`)) {
      const success = await deleteFolder(folderId);
      if (success) {
        showAlert("Folder deleted successfully", "success");
        if (selectedFolder === folderId) setSelectedFolder(null);
      } else {
        showAlert("Failed to delete folder", "error");
      }
    }
  };

  // Handle edit folder
  const handleEditFolder = (folder) => {
    setEditFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  // Handle update folder
  const handleUpdateFolder = async () => {
    if (!editFolderName.trim()) {
      showAlert("Please enter a folder name", "warning");
      return;
    }
    const success = await updateFolder(editFolderId, editFolderName.trim());
    if (success) {
      showAlert(`Folder renamed to "${editFolderName}"`, "success");
      setEditFolderId(null);
      setEditFolderName("");
      setShowFolderOptions(false);
    } else {
      showAlert("Failed to rename folder", "error");
    }
  };

  // Handle select folder
  const handleSelectFolder = (folderId) => {
    setSelectedFolder(folderId);
  };

  // Handle drag start for folder
  const handleFolderDragStart = (e, folderId) => {
    e.dataTransfer.setData("folderId", folderId);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop for notes
  const handleDropNote = async (e, folderId) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("noteId");
    if (noteId) {
      const success = await moveNotesToFolder([noteId], folderId);
      if (success) {
        showAlert(`Note moved to "${folderId ? folders.find(f => f.id === folderId)?.name || "No Folder" : "No Folder"}"`, "success");
      } else {
        showAlert("Failed to move note", "error");
      }
    }
  };

  // Handle drop for folders
  const handleDropFolder = async (e, parentFolderId) => {
    e.preventDefault();
    const folderId = e.dataTransfer.getData("folderId");
    if (folderId && folderId !== parentFolderId) {
      const success = await moveFolder(folderId, parentFolderId);
      if (success) {
        showAlert(`Folder moved successfully`, "success");
      } else {
        showAlert("Failed to move folder", "error");
      }
    }
  };

  // Handle analytics modal toggle
  const handleAnalyticsToggle = () => {
    if (selectedNotes.length === 0) {
      showAlert("Please select at least one note to view analytics", "warning");
      return;
    }
    const selectedNoteObjects = notes.filter((note) => selectedNotes.includes(note.uid));
    const allPublic = selectedNoteObjects.every((note) => note.isPublic);
    if (!allPublic) {
      showAlert("Analytics are only available for public notes", "warning");
      return;
    }
    setShowAnalyticsModal(true);
  };

  // Filter notes
  const filteredNotes = (Array.isArray(notes) ? notes : [])
    .filter((n) => n && typeof n === "object" && n.tag && (filterTag ? n.tag === filterTag : true))
    .filter((n) => n && typeof n === "object" && n.title && typeof n.title === "string" && n.title.toLowerCase().includes(searchQuery))
    .filter((n) => selectedFolder === null ? !n.folder : n.folder === selectedFolder);

  // Build folder tree for nested rendering
  const buildFolderTree = (folders, parentId = null, level = 0) => {
    return folders
      .filter((folder) => folder.parentFolder === parentId)
      .map((folder) => ({
        ...folder,
        children: buildFolderTree(folders, folder.id, level + 1),
        level,
      }));
  };

  const folderTree = buildFolderTree(folders);

  // Time Ago Utility
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} minute(s) ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour(s) ago`;
    return `${Math.floor(hours / 24)} day(s) ago`;
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-700 to-blue-600">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 via-purple-700/50 to-blue-600/50 animate-gradient-bg" />
      <div className="relative z-10">
        <AddNote showAlert={showAlert} />

        {/* Notes and Filters */}
        <div className="flex-1 space-y-6 py-4 px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search notes by title..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-800 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-200/50 shadow-sm transition-all duration-300 indent-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search notes by title"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500">
                <FaSearch size={18} />
              </div>
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-600 transition duration-300"
                  onClick={() => handleSearchChange({ target: { value: "" } })}
                  aria-label="Clear search query"
                  role="button"
                >
                  <FaTimes size={18} />
                </motion.button>
              )}
            </div>
            <div className="relative w-full">
              <select
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-200/50 shadow-sm transition-all duration-300 text-sm sm:text-base appearance-none pr-10"
                onChange={handleFilterChange}
                value={filterTag}
                aria-label="Filter notes by tag"
              >
                <option value="">Filter by Tag</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Important">Important</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none">
                <FaChevronDown size={16} />
              </div>
              {filterTag && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-600 transition duration-300 bg-purple-100/50 rounded-full p-1"
                  onClick={() => setFilterTag("")}
                  aria-label="Clear tag filter"
                  role="button"
                >
                  <FaTimes size={14} />
                </motion.button>
              )}
            </div>
            <style jsx>{`
              select {
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
              }
            `}</style>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 bg-white/10 rounded-lg py-3 sm:py-4 px-4 sm:px-6 shadow-md relative">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 shadow-md transition-all duration-300 text-xs sm:text-sm"
                onClick={handleDeleteSelected}
                disabled={loading || selectedNotes.length === 0}
                aria-label="Delete selected notes"
              >
                <FaTrash /> Delete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 shadow-md transition-all duration-300 text-xs sm:text-sm"
                onClick={handleBulkDownload}
                disabled={loading || selectedNotes.length === 0 || isDownloading}
                aria-label="Download selected notes"
              >
                <FaDownload /> Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center gap-1 sm:gap-2 shadow-md transition-all duration-300 text-xs sm:text-sm"
                onClick={() => setShowFolderOptions(!showFolderOptions)}
                aria-label="Folder options"
              >
                <FaFolderPlus /> Folders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 shadow-md transition-all duration-300 text-xs sm:text-sm"
                onClick={handleAnalyticsToggle}
                disabled={loading || selectedNotes.length === 0}
                aria-label="View analytics for selected notes"
              >
                <FaChartBar /> Analytics
              </motion.button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-white">
              <div
                className="w-5 h-5 rounded-md bg-white/10 border border-purple-400/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-purple-400/20"
                role="checkbox"
                aria-checked={selectedNotes.length === filteredNotes.length && filteredNotes.length > 0}
                aria-label="Select all notes"
                onClick={handleSelectAll}
              >
                {selectedNotes.length === filteredNotes.length && filteredNotes.length > 0 && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium">
                {selectedNotes.length} of {filteredNotes.length} selected
              </span>
            </div>
            {/* Folder Options Popup */}
            {showFolderOptions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bg-gradient-to-r from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl top-16 left-2 z-50 w-48 sm:w-64 border border-purple-400/20"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-white/95">Folder Options</p>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    onClick={() => setShowFolderOptions(false)}
                    className="text-white/90 hover:text-red-400 transition-transform"
                    title="Close"
                    aria-label="Close folder options"
                  >
                    <FaTimes size={14} />
                  </motion.button>
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="New folder name..."
                    className="w-full px-2 py-1 bg-white/95 text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    aria-label="New folder name"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleCreateFolder}
                    className="mt-2 w-full px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm"
                    aria-label="Create folder"
                  >
                    Create Folder
                  </motion.button>
                </div>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleSelectFolder(null)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      handleDropNote(e, null);
                      handleDropFolder(e, null);
                    }}
                    className={`px-2 py-1 text-sm rounded-lg ${
                      selectedFolder === null
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    } text-left flex items-center gap-2`}
                    aria-label="All Notes folder"
                  >
                    <FaFolder className="text-white" /> All Notes
                  </motion.button>
                  {folderTree.map((folder) => (
                    <div key={folder.id} className="flex flex-col">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`px-2 py-1 text-sm rounded-lg ${
                          selectedFolder === folder.id
                            ? "bg-purple-600 text-white"
                            : "bg-white/10 text-white/90 hover:bg-white/20"
                        } text-left flex items-center justify-between gap-2`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          handleDropNote(e, folder.id);
                          handleDropFolder(e, folder.id);
                        }}
                        draggable
                        onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                      >
                        {editFolderId === folder.id ? (
                          <div className="flex items-center w-full">
                            <input
                              type="text"
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white/95 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                              onKeyPress={(e) => e.key === "Enter" && handleUpdateFolder()}
                              aria-label="Edit folder name"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={handleUpdateFolder}
                              className="ml-2 text-white hover:text-purple-300"
                              aria-label="Save folder name"
                            >
                              <FaChevronDown size={12} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => setEditFolderId(null)}
                              className="ml-1 text-white hover:text-purple-300"
                              aria-label="Cancel edit"
                            >
                              <FaTimes size={12} />
                            </motion.button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectFolder(folder.id)}
                              className="flex-1 text-left flex items-center gap-2"
                              aria-label={`${folder.name} folder`}
                            >
                              {selectedFolder === folder.id ? (
                                <FaFolderOpen className="text-white" />
                              ) : (
                                <FaFolder className="text-white" />
                              )}
                              <span>{folder.name}</span>
                            </button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleEditFolder(folder)}
                              className="text-white hover:text-purple-300"
                              aria-label={`Edit ${folder.name} folder`}
                            >
                              <FaChevronDown size={12} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="text-white hover:text-red-400"
                              aria-label={`Delete ${folder.name} folder`}
                            >
                              <FaTrash size={12} />
                            </motion.button>
                          </>
                        )}
                      </motion.div>
                      {folder.children.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {folder.children.map((child) => (
                            <motion.div
                              key={child.id}
                              whileHover={{ scale: 1.05 }}
                              className={`px-2 py-1 text-sm rounded-lg ${
                                selectedFolder === child.id
                                  ? "bg-purple-600 text-white"
                                  : "bg-white/10 text-white/90 hover:bg-white/20"
                              } text-left flex items-center justify-between gap-2`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                handleDropNote(e, child.id);
                                handleDropFolder(e, child.id);
                              }}
                              draggable
                              onDragStart={(e) => handleFolderDragStart(e, child.id)}
                            >
                              {editFolderId === child.id ? (
                                <div className="flex items-center w-full">
                                  <input
                                    type="text"
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    className="flex-1 px-2 py-1 bg-white/95 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                                    onKeyPress={(e) => e.key === "Enter" && handleUpdateFolder()}
                                    aria-label="Edit folder name"
                                  />
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={handleUpdateFolder}
                                    className="ml-2 text-white hover:text-purple-300"
                                    aria-label="Save folder name"
                                  >
                                    <FaChevronDown size={12} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setEditFolderId(null)}
                                    className="ml-1 text-white hover:text-purple-300"
                                    aria-label="Cancel edit"
                                  >
                                    <FaTimes size={12} />
                                  </motion.button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSelectFolder(child.id)}
                                    className="flex-1 text-left flex items-center gap-2"
                                    aria-label={`${child.name} folder`}
                                  >
                                    {selectedFolder === child.id ? (
                                      <FaFolderOpen className="text-white" />
                                    ) : (
                                      <FaFolder className="text-white" />
                                    )}
                                    <span>{child.name}</span>
                                  </button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => handleEditFolder(child)}
                                    className="text-white hover:text-purple-300"
                                    aria-label={`Edit ${child.name} folder`}
                                  >
                                    <FaChevronDown size={12} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => handleDeleteFolder(child.id)}
                                    className="text-white hover:text-red-400"
                                    aria-label={`Delete ${child.name} folder`}
                                  >
                                    <FaTrash size={12} />
                                  </motion.button>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Edit Note Modal */}
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm transition-opacity duration-300"
              role="dialog"
              aria-modal="true"
              aria-label="Edit note modal"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
                    <CircularProgress size={50} />
                    <span className="ml-4 text-white text-lg font-medium">Saving...</span>
                  </div>
                )}
                <div className="px-8 py-5 border-b border-white/20">
                  <h2 className="text-2xl font-bold text-center tracking-wider uppercase text-purple-200">
                    Edit Your Note
                  </h2>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-8 bg-white text-gray-800 rounded-b-2xl">
                  <form onSubmit={handleClick}>
                    <div className="mb-6">
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-2"
                        aria-label="Note title"
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={note.title}
                        onChange={onChange}
                        className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                        placeholder="Enter note title"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                        aria-label="Note description"
                      >
                        Description
                      </label>
                      <Editor
                        apiKey={process.env.REACT_APP_TINYMCE_API_KEY || "your-tinymce-api-key"}
                        value={note.description}
                        onEditorChange={handleEditorChange}
                        init={{
                          height: 600,
                          menubar: "file edit view insert format tools table help",
                          plugins: [
                            "advlist",
                            "autolink",
                            "lists",
                            "link",
                            "image",
                            "charmap",
                            "preview",
                            "anchor",
                            "searchreplace",
                            "visualblocks",
                            "visualchars",
                            "code",
                            "fullscreen",
                            "insertdatetime",
                            "media",
                            "table",
                            "paste",
                            "help",
                            "wordcount",
                            "directionality",
                            "emoticons",
                            "template",
                            "codesample",
                            "toc",
                            "hr",
                            "pagebreak",
                            "nonbreaking",
                            "imagetools",
                            "textpattern",
                          ],
                          toolbar1:
                            "undo redo | cut copy paste | removeformat | searchreplace | code codesample preview print fullscreen help",
                          toolbar2:
                            "formatselect fontselect fontsizeselect | bold italic underline strikethrough subscript superscript | blockquote | forecolor backcolor",
                          toolbar3:
                            "alignleft aligncenter alignright Ribe-justify | outdent indent | numlist bullist | hr pagebreak nonbreaking | anchor link image media emoticons",
                          toolbar4:
                            "table | charmap emoticons | insertdatetime template toc | ltr rtl directionality",
                          toolbar_mode: "sliding",
                          content_style: "body { font-family: Arial, sans-serif; font-size: 16px; }",
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="tag"
                        className="block text-sm font-medium text-gray-700 mb-2"
                        aria-label="Note tag"
                      >
                        Tag
                      </label>
                      <input
                        type="text"
                        id="tag"
                        name="tag"
                        value={note.tag}
                        onChange={onChange}
                        className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                        placeholder="Add a tag (e.g., Work, Personal)"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        type="button"
                        className="px-6 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-100 shadow-md transition-all duration-300"
                        onClick={() => {
                          setIsModalOpen(false);
                          setNote({ id: "", title: "", description: "", tag: "" });
                        }}
                        disabled={loading}
                        aria-label="Cancel"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        type="submit"
                        className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-500 transition-all duration-300"
                        disabled={loading}
                        aria-label="Save changes"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Modal */}
          <AnalyticsModal
            isOpen={showAnalyticsModal && analyticsData.length > 0}
            onClose={() => setShowAnalyticsModal(false)}
            analyticsData={analyticsData}
            loading={loading}
            getTimeAgo={getTimeAgo}
          />

          {/* Notes Section */}
          <div className="relative bg-white/10 rounded-2xl shadow-xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white text-center">
                <Typed
                  strings={[
                    "Your <span style='color:#FDE047;'>ApniNoteBook</span> Notes",
                    "Organize Your <span style='color: #FDE047;'>Thoughts</span>",
                    "Be <span style='color: #FDE047;'>Creative</span>!",
                  ]}
                  typeSpeed={50}
                  backSpeed={50}
                  loop
                />
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 10 }}
                onClick={toggleFullScreen}
                className="p-3 text-white hover:text-purple-300 transition duration-300"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
              >
                {isFullScreen ? <FaCompress size={24} /> : <FaExpand size={24} />}
              </motion.button>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40">
                <CircularProgress size={50} className="text-purple-300" />
                <span className="mt-4 text-lg text-white/90 font-medium">
                  Loading Notes...
                </span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-10 animate-fadeIn">
                <p className="text-xl text-white/90 italic font-medium">
                  No notes available.
                </p>
                <p className="text-white/70 mt-2">
                  Start creating one to organize your thoughts!
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <NoteItem
                      note={note}
                      updateNote={updateNote}
                      showAlert={showAlert}
                      isSelected={selectedNotes.includes(note.uid)}
                      onSelect={() => handleNoteSelection(note.uid)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-gradient-bg {
          animation: gradientShift 15s ease infinite;
          background-size: 200% 200%;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Dashboard;