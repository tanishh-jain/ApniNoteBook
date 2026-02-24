import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, X, Link as LinkIcon, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import LazyLoad from 'react-lazyload';
import toast, { Toaster } from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Tilt } from 'react-tilt';
import Lottie from 'lottie-react';
import { useDebounce } from 'use-debounce';
import { FaSearch } from 'react-icons/fa';

// Lottie animation for empty state (unchanged)
const emptyStateAnimation = {
  v: '5.7.1',
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'Notebook',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Notebook Shape',
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { a: 0, k: 0, ix: 10 },
        p: { a: 0, k: [100, 100, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: { a: 0, k: [100, 100, 100], ix: 6 },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'rc',
              d: 1,
              s: { a: 0, k: [80, 120], ix: 2 },
              p: { a: 0, k: [0, 0], ix: 3 },
              r: { a: 0, k: 10, ix: 4 },
              nm: 'Rectangle Path',
              mn: 'ADBE Vector Shape - Rect',
              hd: false,
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.976, 0.702, 0.204, 1], ix: 3 },
              o: { a: 0, k: 100, ix: 4 },
              w: { a: 0, k: 4, ix: 5 },
              lc: 2,
              lj: 2,
              bm: 0,
              nm: 'Stroke 1',
              mn: 'ADBE Vector Graphic - Stroke',
              hd: false,
            },
            {
              ty: 'fl',
              c: { a: 0, k: [0.976, 0.702, 0.204, 0.2], ix: 4 },
              o: { a: 0, k: 100, ix: 5 },
              r: 1,
              bm: 0,
              nm: 'Fill 1',
              mn: 'ADBE Vector Graphic - Fill',
              hd: false,
            },
          ],
          nm: 'Rectangle',
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: 'ADBE Vector Group',
          hd: false,
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-4 text-center bg-red-100 rounded-lg flex flex-col items-center gap-4">
          <FaExclamationTriangle className="text-2xl" />
          <span>Error rendering notes: {this.state.errorMessage}</span>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="w-full max-w-[280px] sm:max-w-[300px] h-[384px] bg-white/10 rounded-xl shadow-lg animate-pulse mx-auto">
    <div className="h-48 w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-t-xl p-4">
      <div className="h-6 w-3/4 bg-gray-500/20 rounded"></div>
      <div className="h-4 w-5/6 bg-gray-500/20 rounded mt-2"></div>
      <div className="h-4 w-4/6 bg-gray-500/20 rounded mt-1"></div>
    </div>
    <div className="flex justify-center -mt-14">
      <div className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center">
        <div className="w-24 h-24 bg-gray-500/20 rounded-full"></div>
      </div>
    </div>
    <div className="text-center mt-4">
      <div className="h-6 w-3/4 bg-gray-500/20 rounded mx-auto"></div>
      <div className="h-4 w-1/2 bg-gray-500/20 rounded mx-auto mt-2"></div>
    </div>
    <div className="flex justify-center gap-2 mt-4">
      <div className="w-20 h-8 bg-gray-500/20 rounded"></div>
      <div className="w-20 h-8 bg-gray-500/20 rounded"></div>
    </div>
  </div>
);

// Share preview component for toast notification
const SharePreview = ({ note }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-white/10 backdrop-blur-lg rounded-lg p-4 w-full max-w-sm mx-auto border border-purple-400/20"
  >
    <h3 className="text-lg font-semibold text-white truncate">{note.title || 'Untitled'}</h3>
    <p className="text-sm text-gray-300 line-clamp-2">{note.sanitizedDescription.replace(/<[^>]+>/g, '')}</p>
    <div className="flex items-center gap-2 mt-2">
      <MessageCircle size={16} className="text-gray-200" />
      <span className="text-sm text-yellow-300">{note.sanitizedUserName}</span>
    </div>
  </motion.div>
);

// Animation variants
const heartVariants = {
  liked: { scale: [1, 1.6, 1], color: '#f87171', transition: { duration: 0.3 } },
  unliked: { scale: 1, color: '#ffffff' },
};

const cardVariants = {
  initial: { opacity: 0, y: 30, rotateX: 10 },
  animate: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const PublishNotes = () => {
  const [publicNotes, setPublicNotes] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { uid } = useParams();
  const location = useLocation();

  // Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [navigate, location]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apnibook-backend.onrender.com';
        const response = await axios.get(`${API_BASE}/api/auth/getuser`, {
          headers: { 'auth-token': token },
        });
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Open note by UID
  useEffect(() => {
    if (uid && publicNotes.length > 0) {
      setIsNoteLoading(true);
      const note = publicNotes.find((n) => n.uid === uid);
      if (note) {
        const sanitizedNote = {
          ...note,
          sanitizedDescription: DOMPurify.sanitize(note.description || 'No Description Available', {
            USE_PROFILES: { html: true },
            ADD_TAGS: ['p', 'div', 'span', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li'],
            ADD_ATTR: ['href', 'style', 'class'],
          }),
          sanitizedUserName: DOMPurify.sanitize(note.user?.name || 'Unknown Author', {
            USE_PROFILES: { html: false },
          }),
          sanitizedUrl: note.url ? DOMPurify.sanitize(note.url, { USE_PROFILES: { html: false } }) : null,
        };
        setSelectedNote(sanitizedNote);
      } else {
        setError('Note not found.');
        navigate('/notes');
      }
      setIsNoteLoading(false);
    }
  }, [uid, publicNotes, navigate]);

  // Toggle full-screen
  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      if (modalRef.current.requestFullscreen) {
        modalRef.current.requestFullscreen();
      } else if (modalRef.current.webkitRequestFullscreen) {
        modalRef.current.webkitRequestFullscreen();
      } else if (modalRef.current.msRequestFullscreen) {
        modalRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }, [isFullScreen]);

  // Sync full-screen state
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Sanitize notes
  const sanitizedNotes = useMemo(() => {
    return publicNotes.map((note) => ({
      ...note,
      sanitizedDescription: DOMPurify.sanitize(note.description || 'No Description Available', {
        USE_PROFILES: { html: true },
        ADD_TAGS: ['p', 'div', 'span', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li'],
        ADD_ATTR: ['href', 'style', 'class'],
      }),
      sanitizedUserName: DOMPurify.sanitize(note.user?.name || 'Unknown Author', {
        USE_PROFILES: { html: false },
      }),
      sanitizedUrl: note.url ? DOMPurify.sanitize(note.url, { USE_PROFILES: { html: false } }) : null,
    }));
  }, [publicNotes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    if (!debouncedSearchTerm) return sanitizedNotes;
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    return sanitizedNotes.filter(
      (note) =>
        note.title?.toLowerCase().includes(lowercasedTerm) ||
        note.sanitizedUserName.toLowerCase().includes(lowercasedTerm) ||
        note.uid?.toLowerCase().includes(lowercasedTerm)
    );
  }, [sanitizedNotes, debouncedSearchTerm]);

  // Fetch public notes
  useEffect(() => {
    const fetchPublicNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { 'auth-token': token } } : {};
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apnibook-backend.onrender.com';
        const response = await axios.get(`${API_BASE}/api/notes/public`, config);
        if (Array.isArray(response.data)) {
          setPublicNotes(response.data);
        } else {
          throw new Error('Invalid data format received from the server');
        }
      } catch (err) {
        const message = err.response
          ? `Failed to fetch public notes: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`
          : err.request
            ? 'No response from server. Check your network or server status.'
            : `Error: ${err.message}`;
        setError(message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicNotes();
  }, []);

  // Sync likes and comments
  useEffect(() => {
    if (selectedNote) {
      setLikes(selectedNote.likes || 0);
      setComments(selectedNote.comments || []);
    }
  }, [selectedNote]);

  // Handle like/unlike
  const handleToggleLike = useCallback(
    async (noteId, e) => {
      e.stopPropagation();
      try {
        const token = localStorage.getItem('token');
        const note = publicNotes.find((n) => n.uid === noteId);
        if (!note) return;
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apnibook-backend.onrender.com';
        await axios.post(`${API_BASE}/api/notes/${noteId}/like`, {}, { headers: { 'auth-token': token } });
        setPublicNotes((prev) =>
          prev.map((n) =>
            n.uid === noteId
              ? { ...n, likedByUser: !n.likedByUser, likes: n.likedByUser ? n.likes - 1 : n.likes + 1 }
              : n
          )
        );
        if (selectedNote && selectedNote.uid === noteId) {
          setSelectedNote((prev) => ({
            ...prev,
            likedByUser: !prev.likedByUser,
            likes: prev.likedByUser ? prev.likes - 1 : prev.likes + 1,
          }));
          setLikes(note.likedByUser ? likes - 1 : likes + 1);
        }
        toast.success(note.likedByUser ? 'Note unliked!' : 'Note liked!', { duration: 2000 });
      } catch (err) {
        console.error('Error toggling like:', err);
        toast.error('Failed to toggle like', { duration: 2000 });
      }
    },
    [publicNotes, selectedNote, likes]
  );

  // Handle comment submission
  const handleCommentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      try {
        const token = localStorage.getItem('token');
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apnibook-backend.onrender.com';
        const res = await axios.post(
          `${API_BASE}/api/notes/${selectedNote.uid}/comment`,
          { text: newComment },
          { headers: { 'auth-token': token, 'Content-Type': 'application/json' } }
        );
        setComments((prev) => [...prev, res.data.comment]);
        setPublicNotes((prev) =>
          prev.map((n) =>
            n.uid === selectedNote.uid ? { ...n, comments: [...(n.comments || []), res.data.comment] } : n
          )
        );
        setNewComment('');
        setShowPicker(false);
        toast.success('Comment posted!', { duration: 2000 });
      } catch (err) {
        console.error('Error adding comment:', err);
        toast.error('Failed to post comment', { duration: 2000 });
      }
    },
    [newComment, selectedNote?.uid]
  );

  // Handle comment deletion
  const handleDeleteComment = useCallback(
    async (noteUid, commentId) => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://apnibook-backend.onrender.com';
        await axios.delete(`${API_BASE}/api/notes/${noteUid}/comment/${commentId}`, {
          headers: { 'auth-token': token },
        });
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setPublicNotes((prev) =>
          prev.map((n) =>
            n.uid === noteUid ? { ...n, comments: n.comments.filter((c) => c._id !== commentId) } : n
          )
        );
        toast.success('Comment deleted!', { duration: 2000 });
      } catch (err) {
        console.error('Error deleting comment:', err);
        toast.error('Failed to delete comment', { duration: 2000 });
      }
    },
    []
  );

  // Handle sharing
  const handleShare = useCallback(
    (noteId, e) => {
      e.stopPropagation();
      const shareLink = `${window.location.origin}/notes/${noteId}`;
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      const sanitizedNote = sanitizedNotes.find((n) => n.uid === noteId);
      if (sanitizedNote) {
        toast.custom(
          (t) => <SharePreview note={sanitizedNote} />,
          { duration: 3000 }
        );
      } else {
        toast.error('Note not found for sharing', { duration: 2000 });
      }
    },
    [sanitizedNotes]
  );

  // Format timestamp
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes} minute(s) ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour(s) ago`;
    return `${Math.floor(hours / 24)} day(s) ago`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 p-4 sm:p-6 lg:p-8 animate-[gradientShift_15s_ease_infinite] bg-[length:200%_200%] bg-fixed font-poppins">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .scrollbar-thin {
              scrollbar-width: thin;
              scrollbar-color: rgba(75, 85, 99, 0.7) transparent;
            }
            .scrollbar-thin::-webkit-scrollbar {
              width: 8px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background-color: rgba(75, 85, 99, 0.7);
              border-radius: 4px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: transparent;
            }
            .font-poppins {
              font-family: 'Poppins', sans-serif;
            }
          `}
        </style>
        <Toaster position="top-right" toastOptions={{ style: { background: 'rgba(255, 255, 255, 0.15)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(192, 132, 252, 0.2)' } }} />

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-red-400 text-center mb-8 bg-white/10 backdrop-blur-lg p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 max-w-2xl mx-auto border border-red-500/30"
            aria-live="assertive"
          >
            <AlertTriangle className="text-xl" />
            <span className="font-medium">{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Search bar */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, user, or UID"
              className="w-full px-4 py-3 bg-white/15 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/20 shadow-md placeholder-gray-300 transition-all hover:bg-white/25 border border-purple-400/20"
              aria-label="Search public notes"
            />
            <FaSearch  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          </div>
        </div>

        {/* No notes found */}
        {filteredNotes.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-gray-200 bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-lg max-w-sm sm:max-w-md mx-auto border border-purple-400/20"
          >
            <Lottie animationData={emptyStateAnimation} loop={true} className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium">No public notes found.</p>
            <p className="text-sm text-gray-300">Be the first to share your thoughts!</p>
          </motion.div>
        )}

      {/* Notes grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
  {filteredNotes.map((note, index) => (
    <LazyLoad key={note.uid} height={384} offset={100} placeholder={<SkeletonCard />}>
      <Tilt options={{ max: 15, scale: 1.05, speed: 400 }}>
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: index * 0.1 }}
          onClick={() => setSelectedNote(note)}
          className="w-full max-w-[280px] sm:max-w-[320px] h-[400px] bg-white rounded-xl shadow-lg border border-purple-400/20 mx-auto overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-purple-400/40"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedNote(note);
            }
          }}
          aria-label={`Open note: ${note.title || 'Untitled'}`}
        >
          {/* Gradient Header */}
          <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-purple-700 p-4 sm:p-5">
            <div
              className="text-sm text-purple-200 line-clamp-5 mt-2"
              dangerouslySetInnerHTML={{ __html: note.sanitizedDescription || 'No Description Available' }}
            />
          </div>
          {/* White Lower Body */}
          <div className="bg-white pt-4 pb-6 px-4 sm:px-5 flex flex-col items-center">
            <div className="flex justify-center -mt-14 mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border border-purple-400/20">
                {note.user?.profilePicture ? (
                  <img
                    src={note.user.profilePicture}
                    alt={`${note.sanitizedUserName}'s profile`}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                    {note.sanitizedUserName[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-semibold text-blue-900 truncate px-2">{note.title || 'Untitled'}</div>
              <div className="text-sm text-purple-700 truncate px-2 mt-1">{note.sanitizedUserName}</div>
            </div>
            <div className="flex justify-center gap-3 sm:gap-4 mt-4">
              <motion.button
                onClick={(e) => handleToggleLike(note.uid, e)}
                variants={heartVariants}
                animate={note.likedByUser ? 'liked' : 'unliked'}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border border-white/10"
                aria-label={note.likedByUser ? 'Unlike this note' : 'Like this note'}
              >
                <Heart
                  size={16}
                  fill={note.likedByUser ? '#f87171' : 'none'}
                  color={note.likedByUser ? '#f87171' : '#ffffff'}
                />
                <span className="text-sm">{note.likes || 0}</span>
              </motion.button>
              <motion.button
                onClick={(e) => handleShare(note.uid, e)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border border-white/10"
                aria-label="Share this note"
              >
                <Share2 size={16} />
                {copied && note.uid === selectedNote?.uid && (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-yellow-300"
                  >
                    Copied!
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Tilt>
    </LazyLoad>
  ))}
</div>

        {/* Modal */}
        <AnimatePresence>
          {selectedNote && !isNoteLoading && (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.85, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 50 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`fixed inset-0 z-50 flex items-center justify-center ${isFullScreen ? 'bg-transparent' : 'bg-black/80 backdrop-blur-lg'}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <motion.div
                className={`bg-gradient-to-br from-blue-700 to-purple-800 text-white ${isFullScreen ? 'w-full h-full' : 'w-11/12 sm:w-3/4 lg:w-2/3 max-h-[90vh] rounded-2xl shadow-2xl border border-purple-400/20'} p-4 sm:p-6 lg:p-8 relative overflow-y-auto scrollbar-thin`}
              >
                {isFullScreen ? (
                  <>
                    <motion.button
                      onClick={toggleFullScreen}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-4 right-4 text-white hover:text-yellow-300"
                      title="Exit Full Screen"
                      aria-label="Exit Full Screen"
                    >
                      <Minimize2 size={24} />
                    </motion.button>
                    <div className="p-4">
                      <h3 id="modal-title" className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">
                        {selectedNote.title || 'Untitled Note'}
                      </h3>
                      <div className="text-white text-sm sm:text-base leading-relaxed max-h-[80vh] overflow-y-auto scrollbar-thin">
                        {selectedNote.sanitizedDescription ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedNote.sanitizedDescription }} />
                        ) : (
                          <p className="text-gray-300">No description available.</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        {selectedNote.user?.profilePicture ? (
                          <img
                            src={selectedNote.user.profilePicture}
                            alt={`${selectedNote.sanitizedUserName}'s profile`}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {selectedNote.sanitizedUserName[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <p className="font-semibold text-white" aria-label={`Published by ${selectedNote.sanitizedUserName}`}>
                          {selectedNote.sanitizedUserName}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          onClick={toggleFullScreen}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-gray-200 hover:text-yellow-300 transition"
                          title="Enter Full Screen"
                          aria-label="Enter Full Screen"
                        >
                          <Maximize2 size={20} />
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            if (isFullScreen) {
                              if (document.exitFullscreen) document.exitFullscreen();
                              else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                              else if (document.msExitFullscreen) document.msExitFullscreen();
                            }
                            setSelectedNote(null);
                            setShowPicker(false);
                            if (uid) navigate('/notes');
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-gray-200 hover:text-yellow-300 transition"
                          title="Close Modal"
                          aria-label="Close Modal"
                        >
                          <X size={20} />
                        </motion.button>
                      </div>
                    </div>
                    <h3 id="modal-title" className="text-2xl sm:text-3xl font-bold text-center text-white mb-6">
                      {selectedNote.title || 'Untitled Note'}
                    </h3>
                    <div className="text-white text-sm sm:text-base leading-relaxed mb-6 max-h-64 overflow-y-auto scrollbar-thin">
                      {selectedNote.sanitizedDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedNote.sanitizedDescription }} />
                      ) : (
                        <p className="text-gray-300">No description available.</p>
                      )}
                    </div>
                    <div className="mb-6">
                      {selectedNote.sanitizedUrl && (
                        <a
                          href={selectedNote.sanitizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-300 hover:text-yellow-200 flex items-center gap-2 text-sm mb-3"
                          aria-label={`Visit ${selectedNote.sanitizedUrl}`}
                        >
                          <LinkIcon size={16} />
                          {selectedNote.sanitizedUrl}
                        </a>
                      )}
                      {selectedNote.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedNote.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-400/20 text-yellow-200 rounded-full text-xs font-medium border border-purple-400/20"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-6 border-t border-purple-400/20 pt-4">
                      <motion.button
                        onClick={() => {
                          handleToggleLike(selectedNote.uid, { stopPropagation: () => {} });
                        }}
                        variants={heartVariants}
                        animate={selectedNote.likedByUser ? 'liked' : 'unliked'}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-400/20 text-white rounded-lg hover:bg-purple-400/30 transition border border-purple-400/20"
                        aria-label={selectedNote.likedByUser ? 'Unlike this note' : 'Like this note'}
                      >
                        <Heart
                          size={18}
                          fill={selectedNote.likedByUser ? '#f87171' : 'none'}
                          color={selectedNote.likedByUser ? '#f87171' : '#ffffff'}
                        />
                        <span>{selectedNote.likes || 0}</span>
                      </motion.button>
                      <motion.button
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-400/20 text-white rounded-lg hover:bg-purple-400/30 transition border border-purple-400/20"
                        aria-label="Toggle comments section"
                      >
                        <MessageCircle size={18} />
                        <span>{comments.length || 0}</span>
                      </motion.button>
                      <motion.button
                        onClick={(e) => handleShare(selectedNote.uid, e)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-400/20 text-white rounded-lg hover:bg-purple-400/30 transition border border-purple-400/20"
                        aria-label="Share this note"
                      >
                        <Share2 size={18} />
                        {copied && (
                          <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-green-400 text-sm"
                          >
                            Copied!
                          </motion.span>
                        )}
                      </motion.button>
                    </div>
                    {!isUserLoading && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: isCommentsOpen ? 'auto' : 0, opacity: isCommentsOpen ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                        aria-live="polite"
                      >
                        <div className="max-h-64 overflow-y-auto mb-4 scrollbar-thin">
                          {comments.length === 0 ? (
                            <p className="text-gray-300">No comments yet.</p>
                          ) : (
                            comments.map((comment, index) => (
                              <motion.div
                                key={comment._id || index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="mb-3 p-3 bg-white/10 rounded-lg relative border border-purple-400/20"
                              >
                                <p>
                                  <span className="font-semibold text-gray-200">
                                    {comment.user?.name || 'Anonymous'}
                                  </span>
                                  : {comment.text}
                                </p>
                                {currentUser && comment.user?._id && currentUser._id === comment.user._id && (
                                  <motion.button
                                    onClick={() => handleDeleteComment(selectedNote.uid, comment._id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                    aria-label="Delete comment"
                                  >
                                    <X size={16} />
                                  </motion.button>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <textarea
                              id="commentInput"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="w-full p-3 bg-white/15 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/20 border border-purple-400/20"
                              rows="3"
                              aria-label="Add a comment"
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="absolute bottom-3 right-3 text-white"
                              onClick={() => setShowPicker(!showPicker)}
                              aria-label="Toggle emoji picker"
                            >
                              😊
                            </motion.button>
                            <AnimatePresence>
                              {showPicker && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute bottom-12 right-0 z-10"
                                >
                                  <Picker
                                    data={data}
                                    onEmojiSelect={(emoji) => setNewComment((prev) => prev + emoji.native)}
                                    theme="dark"
                                    set="apple"
                                    previewPosition="none"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-purple-400/20 hover:bg-purple-400/30 text-white rounded-lg border border-purple-400/20"
                            aria-label="Post comment"
                            disabled={!newComment.trim()}
                          >
                            Post
                          </motion.button>
                        </form>
                      </motion.div>
                    )}
                    <p className="mt-6 text-sm text-gray-300 italic">Created: {getTimeAgo(selectedNote.date)}</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(PublishNotes);