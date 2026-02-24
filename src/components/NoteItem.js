import React, { useState, useContext, useMemo, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import noteContext from "../context/notes/NoteContext";
import { motion } from "framer-motion";
import { FaExpand, FaCompress } from "react-icons/fa";
import NoteDownload from "./NoteDownload";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-4">Error rendering note. Please try again.</div>;
    }
    return this.props.children;
  }
}

const NoteItem = ({ note, updateNote, showAlert, isSelected, onSelect }) => {
  const context = useContext(noteContext);
  const { deleteNote, folders, moveNotesToFolder } = context;

  // Local States
  const [viewModal, setViewModal] = useState(false);
  const [isPinned, setIsPinned] = useState(note.isPinned || false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublic, setIsPublic] = useState(note.isPublic || false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFolderOptions, setShowFolderOptions] = useState(false);
  const [customFolder, setCustomFolder] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isPremium, setIsPremium] = useState(localStorage.getItem("isPremium") === "true");
  const modalRef = useRef(null);
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";

  // Synchronize isPublic state with note prop
  useEffect(() => {
    setIsPublic(note.isPublic || false);
  }, [note]);

  // Sanitize note description HTML and cache it
  const sanitizedDescription = useMemo(() => {
    return DOMPurify.sanitize(note.description || "No Description Available", {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["style"],
    });
  }, [note.description]);

  // Toggle Pin
  const togglePin = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("Please login to pin notes", "warning");
        return;
      }
      const newIsPinned = !isPinned;
      const success = await updateNote(note.uid, note.title, note.description, note.tag, newIsPinned);
      if (success) {
        setIsPinned(newIsPinned);
        showAlert(`Note ${newIsPinned ? "pinned" : "unpinned"} successfully`, "info");
      } else {
        showAlert("Failed to pin note", "error");
      }
    } catch (error) {
      console.error("Failed to pin note:", error);
      showAlert("Failed to pin note", "error");
    }
  };

  // Delete Note using uid
  const handleDelete = () => {
    deleteNote(note.uid);
    showAlert("Note deleted successfully", "success");
  };

  // Handle Publish
  const handlePublish = async () => {
    try {
      const newIsPublic = !isPublic;
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("Please login to publish notes", "warning");
        return;
      }
      const response = await fetch(`${API_BASE}/api/notes/updatenote/${note.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });
      if (!response.ok) {
        throw new Error("Failed to update note");
      }
      setIsPublic(newIsPublic);
      showAlert(`Note ${newIsPublic ? "published" : "unpublished"} successfully`, "success");
    } catch (error) {
      console.error("Failed to publish note:", error);
      showAlert("Failed to publish note", "danger");
    }
  };

  // Handle Move to Folder
  const handleMoveToFolder = async (folder) => {
    const success = await moveNotesToFolder([note.uid], folder);
    if (success) {
      showAlert(`Note moved to "${folder ? folders.find(f => f.id === folder)?.name || "No Folder" : "No Folder"}"`, "success");
      setShowFolderOptions(false);
    } else {
      showAlert("Failed to move note", "error");
    }
  };

  // Handle Drag Start
  const handleDragStart = (e) => {
    e.dataTransfer.setData("noteId", note.uid);
  };

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

  // Toggle Full-Screen for Modal
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (modalRef.current) {
        modalRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit full-screen mode: ${err.message}`);
        });
      }
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

  // Handle Share Click
  const handleShareClick = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("Please login to share notes", "warning");
        return;
      }
      const response = await fetch(`${API_BASE}/api/friends/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      const json = await response.json();
      setFriends(json.friends || []);
      setShowShareModal(true);
    } catch (error) {
      console.error("Error fetching friends:", error);
      showAlert("Failed to fetch friends", "danger");
    }
  };

  // Share Note with Friend
  const shareNoteWithFriend = async (friendId) => {
    try {
      const token = localStorage.getItem("token");
      const plainDescription = sanitizedDescription.replace(/<[^>]+>/g, "");
      const messageContent = `Shared Note: ${note.title}\n\n${plainDescription}`;
      const response = await fetch(`${API_BASE}/api/friends/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({
          recipientId: friendId,
          content: messageContent,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      showAlert("Note shared successfully", "success");
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing note:", error);
      showAlert("Failed to share note", "danger");
    }
  };

  // Note styling
  const tags = Array.isArray(note.tags) ? note.tags : [note.tag || "General"];
  const getFolderName = (folderId) => {
    if (!folderId) return "No Folder";
    const folder = folders.find((f) => f.id === folderId);
    return folder ? folder.name : "No Folder";
  };

  return (
    <ErrorBoundary>
      {/* Note Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[340px] mb-6 mx-auto sm:mx-0"
        draggable
        onDragStart={handleDragStart}
      >
        <div
          className={`p-4 sm:p-5 rounded-1xl bg-gradient-to-r from-indigo-700 to-purple-700 backdrop-blur-sm border border-purple-400/20 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 relative flex flex-col h-[280px] box-border ${
            isSelected ? "ring-2 ring-purple-400" : ""
          }`}
        >
          {/* Pin Button */}
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-purple-400/20 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-transform duration-200 ${
              isPinned ? "text-purple-400 animate-pulse" : "text-white/90"
            }`}
            onClick={togglePin}
            title="Pin this note"
            aria-label="Pin this note"
          >
            <i className="fa-solid fa-thumbtack text-base" />
          </motion.button>

          {/* Note Title */}
          <h5 className="text-base sm:text-lg font-semibold truncate text-white/95 hover:text-white transition-colors">
            {note.title || "Untitled Note"}
          </h5>

          {/* Scrollable Content Area */}
          <div
            className="custom-scrollbar mt-2 flex-1 overflow-y-auto px-1 py-1 text-xs sm:text-sm leading-relaxed relative"
            style={{
              maxHeight: "120px", // Fixed height for description
              scrollbarWidth: "none", // Hide scrollbar for Firefox
              msOverflowStyle: "none", // Hide scrollbar for IE/Edge
            }}
          >
            <div
              className="text-white/90"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-indigo-700/50 to-transparent pointer-events-none" />
          </div>

          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => {
              const tagStyles = {
                General: {
                  bg: "bg-blue-600/30 hover:bg-blue-600/50",
                  border: "border-blue-400/30",
                  text: "text-blue-200",
                  icon: <i className="fa-solid fa-book mr-1" />,
                },
                Work: {
                  bg: "bg-purple-600/30 hover:bg-purple-600/50",
                  border: "border-purple-400/30",
                  text: "text-purple-200",
                  icon: <i className="fa-solid fa-briefcase mr-1" />,
                },
                Personal: {
                  bg: "bg-pink-600/30 hover:bg-pink-600/50",
                  border: "border-pink-400/30",
                  text: "text-pink-200",
                  icon: <i className="fa-solid fa-heart mr-1" />,
                },
              }[tag] || {
                bg: "bg-gray-600/30 hover:bg-gray-600/50",
                border: "border-gray-400/30",
                text: "text-gray-200",
                icon: null,
              };

              return (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center ${tagStyles.bg} ${tagStyles.border} ${tagStyles.text} rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-all duration-200 border shadow-sm backdrop-blur-sm`}
                  role="button"
                  aria-label={`Tag: ${tag}`}
                >
                  {tagStyles.icon}
                  #{tag}
                </motion.span>
              );
            })}
          </div>

          {/* Dates and Folder */}
          <div className="mt-2 text-xs text-white/70 flex items-center gap-2 flex-wrap">
            {note.dueDate && (
              <div>
                <i className="fa-regular fa-calendar mr-1" /> Due:{" "}
                {new Date(note.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </div>
            )}
            <div>
              <i className="fa-regular fa-clock mr-1" /> {getTimeAgo(note.date)}
            </div>
            {note.folder && (
              <div>
                <i className="fa-solid fa-folder mr-1" /> {getFolderName(note.folder)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex justify-between items-center">
            <div className="flex space-x-1">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewModal(true)}
                className="p-1.5 text-white/90 hover:text-purple-400 transition-all"
                title="View Note"
                aria-label="View Note"
              >
                <i className="fa-solid fa-eye text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateNote(note)}
                className="p-1.5 text-white/90 hover:text-purple-400 transition-all"
                title="Edit Note"
                aria-label="Edit Note"
              >
                <i className="fa-solid fa-pen-to-square text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                className="p-1.5 text-white/90 hover:text-red-400 transition-all"
                title="Delete Note"
                aria-label="Delete Note"
              >
                <i className="fa-solid fa-trash text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                className="p-1.5 text-white/90 hover:text-purple-400 transition-all"
                title="Download Note"
                aria-label="Download Note"
              >
                <i className="fa-solid fa-download text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePublish}
                className={`p-1.5 text-${isPublic ? "purple-400" : "white/90"} hover:text-${
                  isPublic ? "purple-500" : "purple-400"
                } transition-all`}
                title={isPublic ? "Unpublish Note" : "Publish Note"}
                aria-label={isPublic ? "Unpublish Note" : "Publish Note"}
              >
                <i className="fa-solid fa-globe text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShareClick}
                className="p-1.5 text-white/90 hover:text-purple-400 transition-all"
                title="Share with Friend"
                aria-label="Share with Friend"
              >
                <i className="fa-solid fa-share text-base" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFolderOptions(!showFolderOptions)}
                className="p-1.5 text-white/90 hover:text-purple-400 transition-all"
                title="Move to Folder"
                aria-label="Move to Folder"
              >
                <i className="fa-solid fa-folder text-base" />
              </motion.button>
            </div>
            <div
              className="w-5 h-5 rounded-md bg-white/10 border border-purple-400/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-purple-400/20"
              role="checkbox"
              aria-checked={isSelected}
              aria-label="Select note"
              onClick={onSelect}
            >
              {isSelected && (
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
          </div>

          {/* Download Options Popup */}
          {showDownloadOptions && (
            <NoteDownload
              note={note}
              isPremium={isPremium}
              showAlert={showAlert}
              isDownloading={isDownloading}
              setIsDownloading={setIsDownloading}
            />
          )}

          {/* Folder Options Popup */}
          {showFolderOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bg-gradient-to-r from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl top-12 right-2 z-50 w-48 sm:w-52 border border-purple-400/20"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-white/95">Folder Options</p>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setShowFolderOptions(false)}
                  className="text-white/90 hover:text-red-400 transition-transform"
                  title="Close"
                  aria-label="Close folder options"
                >
                  <i className="fas fa-times text-sm" />
                </motion.button>
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="New folder name..."
                  className="w-full px-2 py-1 bg-white/90 text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  aria-label="New folder name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleMoveToFolder(null)}
                  className="px-2 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 text-xs text-left"
                  aria-label="Move to No Folder"
                >
                  No Folder
                </motion.button>
                {folders?.map((folder) => (
                  <motion.button
                    key={folder.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleMoveToFolder(folder.id)}
                    className="px-2 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 text-xs text-left"
                    aria-label={`Move to ${folder.name}`}
                  >
                    {folder.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Share Modal */}
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bg-gradient-to-r from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl top-12 left-2 z-50 w-48 sm:w-52 border border-purple-400/20"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-white/95">Share with Friend</p>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setShowShareModal(false)}
                  className="text-white/90 hover:text-red-400 transition-transform"
                  title="Close"
                  aria-label="Close share modal"
                >
                  <i className="fas fa-times text-sm" />
                </motion.button>
              </div>
              {friends.length === 0 ? (
                <p className="text-xs text-white/90">No friends to share with</p>
              ) : (
                <div className="max-h-40 overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend._id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-white/90">{friend.name}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => shareNoteWithFriend(friend._id)}
                        className="p-1 bg-purple-500 rounded-lg text-white hover:bg-purple-600"
                        aria-label={`Share with ${friend.name}`}
                      >
                        Share
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* View Note Modal */}
      {viewModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex justify-center items-center z-50 transition-opacity duration-300 ${
            isFullScreen ? "bg-transparent" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={modalRef}
            className={`bg-gradient-to-r from-indigo-600 to-purple-700 backdrop-blur-sm text-white rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden box-border ${
              isFullScreen
                ? "w-full h-full overflow-y-auto"
                : "w-11/12 max-w-4xl max-h-[85vh] overflow-y-auto"
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-purple-400/20 pb-3">
              <h3 id="modal-title" className="text-lg sm:text-xl font-semibold text-white/95 tracking-wide">
                {note.title || "Untitled Note"}
              </h3>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  onClick={toggleFullScreen}
                  className="p-1.5 text-white/90 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setViewModal(false)}
                  className="p-1.5 text-white/90 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  title="Close Modal"
                  aria-label="Close Modal"
                >
                  <i className="fa-solid fa-times text-lg" />
                </motion.button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="mt-3 sm:mt-4">
              <div
                className="text-white/90 text-xs sm:text-sm leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
              <p className="mt-3 sm:mt-4 text-xs text-white/70 italic">
                <i className="fa-regular fa-calendar-alt mr-1" />
                Created: {getTimeAgo(note.date)}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 sm:mt-6 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setViewModal(false)}
                className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-sm"
                aria-label="Close modal"
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none; /* Hide scrollbar for Webkit browsers */
        }
        .custom-scrollbar {
          -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
          scrollbar-width: none; /* Hide scrollbar for Firefox */
        }
        .custom-scrollbar:hover {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 640px) {
          .max-w-4xl {
            max-width: 95%;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default NoteItem;