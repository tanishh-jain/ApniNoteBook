import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaSearch, FaUserCheck, FaUserTimes, FaPaperPlane, FaComments, FaUser, FaTimes, FaUsers, FaBookOpen, FaSpinner, FaSmile, FaArrowDown, FaExpand, FaCompress } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import io from "socket.io-client";
import Picker from 'emoji-picker-react';
import { IoImageOutline } from "react-icons/io5";

const FriendsPanel = ({ showAlert }) => {
  const host = process.env.NODE_ENV === "production"
    ? "https://apnibook-backend.onrender.com"
    : "http://localhost:5000";

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem("userId") || null);
  const [loadingUser, setLoadingUser] = useState(!localStorage.getItem("userId"));
  const [isTyping, setIsTyping] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const [activeTab, setActiveTab] = useState("chats");
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [showProfileOnMobile, setShowProfileOnMobile] = useState(false);
  const [currentUserProfilePicture, setCurrentUserProfilePicture] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullImage, setShowFullImage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    }
  };

  const toggleFullScreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [selectedFriend]);

 useEffect(() => {
  const newSocket = io(host, { auth: { token } });
  setSocket(newSocket);

  newSocket.on("connect", () => {
    console.log("Connected to Socket.IO server");
  });

  newSocket.on("newMessage", (message) => {
    if (message.sender._id === selectedFriend?._id || message.recipient._id === selectedFriend?._id) {
      setMessages((prev) => {
        // Check if message with this messageId already exists
        if (message.messageId && prev.some((msg) => msg.messageId === message.messageId)) {
          console.log("Duplicate message detected:", message.messageId);
          return prev; // Skip adding if duplicate
        }
        return [...prev, message];
      });
    }
  });

  newSocket.on("typing", ({ friendId, isTyping }) => {
    if (friendId === selectedFriend?._id) {
      setIsTyping(isTyping);
    }
  });

  newSocket.on("userStatus", ({ userId, isOnline }) => {
    setOnlineFriends((prev) => {
      const newSet = new Set(prev);
      if (isOnline) newSet.add(userId);
      else newSet.delete(userId);
      return newSet;
    });
  });

    const fetchCurrentUser = async () => {
      try {
        setLoadingUser(true);
        const response = await fetch(`${host}/api/auth/getuser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
          body: JSON.stringify({}),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        if (json._id) {
          setCurrentUserId(json._id);
          setCurrentUserProfilePicture(json.profilePicture || null);
          localStorage.setItem("userId", json._id);
        } else {
          throw new Error("User ID not found in response");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        showAlert("Failed to fetch user data. Please try again or log out.", "danger");
        navigate("/login");
      } finally {
        setLoadingUser(false);
      }
    };

    if (token && !currentUserId) fetchCurrentUser();

    // Full-screen change listeners
    const handleFullScreenChange = () => {
      setIsFullScreen(!!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);

    return () => {
      newSocket.disconnect();
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, [host, token, showAlert, navigate, currentUserId]);

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${host}/api/friends/list`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        if (json.friends && json.pendingRequests) {
          setFriends(json.friends);
          setPendingRequests(json.pendingRequests);
        } else {
          showAlert("Failed to fetch friends", "danger");
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        showAlert("An error occurred. Please try again later.", "danger");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchFriends();
    else navigate("/login");
  }, [host, token, navigate, showAlert]);

  useEffect(() => {
    if (!socket || !selectedFriend) return;
    if (newMessage.trim() || selectedImage) {
      socket.emit("typing", { friendId: selectedFriend._id, isTyping: true });
    } else {
      socket.emit("typing", { friendId: selectedFriend._id, isTyping: false });
    }
  }, [newMessage, socket, selectedFriend, selectedImage]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${host}/api/friends/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      if (json.length >= 0) {
        setSearchResults(json);
        setShowModal(true);
      } else {
        showAlert("No users found", "danger");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${host}/api/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ recipientId: userId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      if (json.success) {
        showAlert("Friend request sent", "success");
        setSearchResults([]);
        setSearchQuery("");
        setShowModal(false);
      } else {
        showAlert(json.error || "Failed to send friend request", "danger");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(`${host}/api/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ requestId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      if (json.success) {
        setFriends((prev) => [...prev, json.friend]);
        setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
        showAlert("Friend request accepted", "success");
      } else {
        showAlert(json.error || "Failed to accept friend request", "danger");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const declineFriendRequest = async (requestId) => {
    setLoading(true);
    try {
      const response = await fetch(`${host}/api/friends/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ requestId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      if (json.success) {
        setPendingRequests((prev) => prev.filter((req) => req._id !== requestId));
        showAlert("Friend request declined", "success");
      } else {
        showAlert(json.error || "Failed to decline friend request", "danger");
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const selectFriend = async (friend) => {
    setSelectedFriend(friend);
    setShowProfileOnMobile(false);
    setLoading(true);
    try {
      if (!currentUserId) {
        showAlert("User data not loaded. Please try again.", "danger");
        return;
      }
      const response = await fetch(`${host}/api/friends/messages/${friend._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json = await response.json();
      setMessages(json || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      showAlert("An error occurred while fetching messages. Please try again.", "danger");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert("Please select an image file.", "danger");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Image size should not exceed 5MB.", "danger");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const sendMessage = async (event) => {
  event.preventDefault();
  if (!newMessage.trim() && !selectedImage) return;
  setLoading(true);
  try {
    const message = {
      recipientId: selectedFriend._id,
      content: selectedImage ? JSON.stringify({ text: newMessage, image: selectedImage }) : newMessage,
    };
    const response = await fetch(`${host}/api/friends/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": token,
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json = await response.json();
    if (json.success) {
      const newMsg = {
        sender: { _id: currentUserId },
        recipient: { _id: selectedFriend._id }, // Match server response structure
        content: message.content,
        timestamp: new Date(),
        messageId: json.message.messageId, // Use server-generated messageId
      };
      socket.emit("sendMessage", newMsg);
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } else {
      showAlert(json.error || "Failed to send message", "danger");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    showAlert("An error occurred. Please try again later.", "danger");
  } finally {
    setLoading(false);
  }
};

  const closeChat = () => {
    setSelectedFriend(null);
    setMessages([]);
    setShowProfileOnMobile(false);
    setShowEmojiPicker(false);
    setSelectedImage(null);
    setImagePreview(null);
    setShowFullImage(null);
  };

  const toggleNavbar = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (selectedFriend) {
      closeChat();
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === "chats") handleTabChange("search");
      else if (activeTab === "search") handleTabChange("requests");
    },
    onSwipedRight: () => {
      if (activeTab === "requests") handleTabChange("search");
      else if (activeTab === "search") handleTabChange("chats");
    },
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient flex flex-col relative overflow-hidden text-white font-sans" {...swipeHandlers}>
      {/* Particle Background */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 8 + 5}s`,
          }}
        />
      ))}

      {/* Main Content */}
     <div
  className={`flex-1 flex flex-col md:flex-row overflow-y-auto overflow-x-hidden pt-4 px-2 sm:px-3 lg:mx-6 gap-2 sm:gap-4 max-w-7xl w-full self-center ${isFullScreen ? 'h-screen fixed inset-0 z-50' : ''}`}
  style={{ touchAction: 'pan-y' }}
>
  {selectedFriend ? (
    <motion.div
      className="flex flex-col h-[calc(100vh-80px)] w-full glassmorphic-panel rounded-lg sm:rounded-xl overflow-y-auto overflow-x-hidden touch-pan-y"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Profile Section */}
      <AnimatePresence>
        {(showProfileOnMobile || window.innerWidth >= 768) && (
          <motion.div
            className="w-full md:w-72 bg-white/10 backdrop-blur-lg p-2 sm:p-3 lg:p-4 md:rounded-l-lg glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <motion.h3
                className="text-base sm:text-lg lg:text-xl font-extrabold text-white drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Profile
              </motion.h3>
              <motion.button
                onClick={closeChat}
                className="text-white hover:text-yellow-300 focus:ring-2 focus:ring-purple-400 outline-none tooltip"
                data-tooltip="Close Chat"
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close chat"
              >
                <FaTimes className="text-base sm:text-lg" />
              </motion.button>
            </div>
            {selectedFriend.profilePicture ? (
              <motion.img
                src={selectedFriend.profilePicture}
                alt={selectedFriend.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-3 sm:mb-4 ring-2 ring-purple-400/50"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200 }}
              />
            ) : (
              <motion.div whileHover={{ scale: 1.1 }}>
                <FaUser className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-3 sm:mb-4 text-gray-200 ring-2 ring-purple-400/50" />
              </motion.div>
            )}
            <motion.p
              className="text-center font-bold text-sm sm:text-base text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {selectedFriend.name}
            </motion.p>
            <p className="text-xs sm:text-sm text-center text-gray-200 mt-1">ID: {selectedFriend._id}</p>
            <p className="text-xs sm:text-sm text-center text-gray-200 mt-1">
              Status: {onlineFriends.has(selectedFriend._id) ? (
                <span className="text-green-400">Online</span>
              ) : (
                <span className="text-gray-200">Offline</span>
              )}
            </p>
            <p className="text-xs sm:text-sm text-center text-gray-200 mt-1 line-clamp-2">
              {selectedFriend.bio || "No bio available"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Section */}
      <div className="flex-1 flex flex-col relative w-full max-w-7xl overflow-x-hidden">
        <div className="sticky top-0 flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-t-lg sm:rounded-t-xl md:rounded-tr-xl md:rounded-tl-none border-b border-white/20 z-10">
          <div className="flex items-center">
          {selectedFriend.profilePicture ? (
    <motion.img
      src={selectedFriend.profilePicture}
      alt={selectedFriend.name}
      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 ring-2 ring-purple-400/50"
      whileHover={{ scale: 1.2 }}
      onError={(e) => console.error("Failed to load profile picture for", selectedFriend.name)}
    />
  ) : (
    <motion.div whileHover={{ scale: 1.2 }}>
      <FaUser className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 text-gray-200 ring-2 ring-purple-400/50" />
    </motion.div>
  )}
           <motion.h2
    onClick={() => setShowProfileOnMobile(!showProfileOnMobile)}
    className="text-sm sm:text-base lg:text-lg font-bold text-white cursor-pointer hover:text-yellow-300 drop-shadow-lg"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
              {selectedFriend.name}
            </motion.h2>
            {onlineFriends.has(selectedFriend._id) && (
              <motion.span
                className="ml-2 text-xs sm:text-sm text-green-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Online
              </motion.span>
            )}
          </div>
          <motion.button
            onClick={toggleFullScreen}
            className="text-white hover:text-yellow-300 focus:ring-2 focus:ring-purple-400 outline-none tooltip"
            data-tooltip={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullScreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </motion.button>
        </div>
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-900/95 to-gray-800/95 p-2 sm:p-3 lg:p-4 custom-scrollbar touch-pan-y"
          style={{ scrollBehavior: 'smooth', touchAction: 'pan-y', scrollSnapType: 'y mandatory' }}
          aria-live="polite"
        >
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3/4 h-8 sm:h-10 rounded-2xl bg-gray-700/50 animate-pulse"
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-300 text-sm sm:text-base font-medium">
              Start the conversation!
            </p>
          ) : (
            messages.map((msg, index) => {
              let messageContent = msg.content;
              let isImage = false;
              let textContent = msg.content;
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed.image) {
                  isImage = true;
                  textContent = parsed.text || "";
                }
              } catch (e) {
                // Not a JSON string, treat as regular text
              }
              return (
                <motion.div
                  key={index}
                  className={`flex mb-2 sm:mb-3 lg:mb-4 ${msg.sender._id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="flex items-end max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] gap-1 sm:gap-2">
                  {msg.sender._id !== currentUserId && (
  <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0">
    {selectedFriend.profilePicture ? (
      <motion.img
        src={selectedFriend.profilePicture}
        alt={selectedFriend.name}
        className="w-full h-full rounded-full ring-1 ring-teal-400/50 shadow-sm"
        whileHover={{ scale: 1.1 }}
        onError={(e) => console.error("Failed to load profile picture for", selectedFriend.name)}
      />
    ) : (
      <motion.div whileHover={{ scale: 1.1 }}>
        <FaUser className="w-full h-full rounded-full text-gray-300 ring-1 ring-teal-400/50 shadow-sm" />
      </motion.div>
    )}
  </div>
)}
                    <div
                      className={`p-2 sm:p-3 rounded-2xl glassmorphic border transition-all duration-300 relative group ${
                        msg.sender._id === currentUserId
                          ? 'bg-gradient-to-r from-teal-500/90 to-cyan-600/90 text-white border-teal-400/50 rounded-br-none shadow-md'
                          : 'bg-gray-800/70 text-gray-200 border-gray-600/50 rounded-bl-none shadow-sm'
                      } w-full`}
                    >
                      {isImage ? (
                        <>
                          {textContent && (
                            <span className="text-xs sm:text-sm lg:text-base leading-relaxed font-light block mb-2">{textContent}</span>
                          )}
                          <motion.img
                            src={JSON.parse(messageContent).image}
                            alt="Sent image"
                            className="max-w-full max-h-32 sm:max-h-40 lg:max-h-48 rounded-lg object-contain cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setShowFullImage(JSON.parse(messageContent).image)}
                          />
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm lg:text-base leading-relaxed font-light">{messageContent}</span>
                      )}
                      <div className="flex items-center justify-between mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xs text-gray-300/80">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {msg.sender._id === currentUserId && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-teal-200 text-xs"
                          >
                            {msg.read ? '✓✓' : '✓'}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    {msg.sender._id === currentUserId && (
                      <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0">
                        {currentUserProfilePicture ? (
                          <motion.img
                            src={currentUserProfilePicture}
                            alt="You"
                            className="w-full h-full rounded-full ring-1 ring-teal-400/50 shadow-sm"
                            whileHover={{ scale: 1.1 }}
                          />
                        ) : (
                          <motion.div whileHover={{ scale: 1.1 }}>
                            <FaUser className="w-full h-full rounded-full text-gray-300 ring-1 ring-teal-400/50 shadow-sm" />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                className="flex mb-2 sm:mb-3 lg:mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-7 h-7 sm:w-9 sm:h-9 mr-2">
                  {selectedFriend.profilePicture ? (
                    <motion.img
                      src={selectedFriend.profilePicture}
                      alt={selectedFriend.name}
                      className="w-full h-full rounded-full ring-1 ring-teal-400/50 shadow-sm"
                    />
                  ) : (
                    <FaUser className="w-full h-full rounded-full text-gray-300 ring-1 ring-teal-400/50 shadow-sm" />
                  )}
                </div>
                <div className="bg-gray-800/70 p-2 sm:p-3 rounded-2xl rounded-bl-none glassmorphic border border-gray-600/50 shadow-sm flex items-center gap-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-300 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-300 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-300 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.4 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              onClick={scrollToBottom}
              className="absolute bottom-20 sm:bottom-24 right-3 p-2 bg-purple-600 rounded-full text-white shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Scroll to latest message"
            >
              <FaArrowDown size={14} />
            </motion.button>
          )}
        </AnimatePresence>
        <form
          onSubmit={sendMessage}
          className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full bg-gray-900/50 px-2 sm:px-3 py-2 sticky bottom-0 overflow-x-hidden"
        >
          <div className="relative w-full">
            {imagePreview && (
              <div className="mb-2 p-2 bg-gray-800/80 rounded-lg max-w-full sm:max-w-md relative">
                <motion.img
                  src={imagePreview}
                  alt="Image preview"
                  className="w-full h-auto max-h-28 sm:max-h-36 rounded-lg object-contain"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.button
                  onClick={removeImage}
                  type="button"
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove image"
                >
                  <FaTimes size={10} />
                </motion.button>
              </div>
            )}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  className="absolute bottom-full left-0 z-20 mb-2 w-full max-w-[90vw] sm:max-w-xs"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Picker onEmojiClick={onEmojiClick} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center w-full bg-white/10 rounded-lg overflow-hidden">
              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-purple-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle emoji picker"
              >
                <FaSmile size={14} />
              </motion.button>
              <motion.button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-purple-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Attach image"
              >
                <IoImageOutline size={14} />
              </motion.button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
              <motion.input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                whileFocus={{ scale: 1.01 }}
                aria-label="Type a message"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors duration-300 ${
              loading ? 'bg-gray-500 cursor-not-allowed text-white' : 'bg-yellow-300 text-gray-800 hover:bg-yellow-400'
            } flex items-center justify-center gap-1`}
            whileHover={loading ? {} : { scale: 1.05 }}
            whileTap={loading ? {} : { scale: 0.95 }}
            aria-label="Send message"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <FaSpinner size={12} />
              </motion.div>
            ) : (
              <FaPaperPlane size={12} />
            )}
            {loading ? 'Sending...' : 'Send'}
          </motion.button>
        </form>
      </div>
    </motion.div>
  ) : (
    <motion.div
      className="w-full p-3 sm:p-4 lg:p-6 bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300 overflow-x-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      {activeTab === "search" && (
        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
          <motion.h3
            className="text-base sm:text-lg lg:text-xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Search Friends
          </motion.h3>
          <div className="relative">
            <FaSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs sm:text-sm" />
            <motion.input
              type="text"
              placeholder="Search by ID or Name"
              className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 glassmorphic text-xs sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              whileFocus={{ scale: 1.02 }}
              aria-label="Search users"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 sm:mt-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm ${
              loading ? 'bg-gray-400' : 'bg-yellow-300 text-gray-800 hover:bg-yellow-400'
            } flex items-center justify-center glassmorphic tooltip`}
            data-tooltip="Search Users"
            whileHover={loading ? {} : { scale: 1.05, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
            whileTap={loading ? {} : { scale: 0.95 }}
            aria-label="Search"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <FaSpinner className="mr-1 text-xs sm:text-sm" />
              </motion.div>
            ) : (
              <FaSearch className="mr-1 text-xs sm:text-sm" />
            )}
            {loading ? 'Searching…' : 'Search'}
          </motion.button>
        </form>
      )}
      {activeTab === "requests" && (
        <div className="mb-4 sm:mb-6">
          <motion.h3
            className="text-base sm:text-lg lg:text-xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Pending Requests
          </motion.h3>
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-200">No pending requests</p>
          ) : (
            pendingRequests.map((request, index) => (
              <motion.div
                key={request._id}
                className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 flex items-center justify-between glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
              >
                <div className="flex items-center">
                  {request.sender.profilePicture ? (
                    <motion.img
                      src={request.sender.profilePicture}
                      alt={request.sender.name}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 sm:mr-3 ring-2 ring-purple-400/50"
                      whileHover={{ scale: 1.2 }}
                    />
                  ) : (
                    <motion.div whileHover={{ scale: 1.2 }}>
                      <FaUser className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 sm:mr-3 text-gray-200 ring-2 ring-purple-400/50" />
                    </motion.div>
                  )}
                  <span className="text-xs sm:text-sm text-white leading-relaxed">{request.sender.name}</span>
                </div>
                <div className="flex space-x-1 sm:space-x-2">
                  <motion.button
                    onClick={() => acceptFriendRequest(request._id)}
                    disabled={loading}
                    className="p-1 sm:p-1.5 bg-green-500 rounded-full hover:bg-green-600 tooltip"
                    data-tooltip="Accept Request"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Accept friend request"
                  >
                    <FaUserCheck className="text-xs sm:text-sm text-white" />
                  </motion.button>
                  <motion.button
                    onClick={() => declineFriendRequest(request._id)}
                    disabled={loading}
                    className="p-1 sm:p-1.5 bg-red-500 rounded-full hover:bg-red-600 tooltip"
                    data-tooltip="Decline Request"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Decline friend request"
                  >
                    <FaUserTimes className="text-xs sm:text-sm text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
      {activeTab === "chats" && (
        <div>
          <motion.h3
            className="text-base sm:text-lg lg:text-xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Friends
          </motion.h3>
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-200">No friends yet</p>
          ) : (
            friends.map((friend, index) => (
              <motion.div
                key={friend._id}
                onClick={() => selectFriend(friend)}
                className="bg-white/10 hover:bg-white/15 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 flex items-center cursor-pointer relative glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  {friend.profilePicture ? (
                    <motion.img
                      src={friend.profilePicture}
                      alt={friend.name}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full ring-2 ring-purple-400/50"
                      whileHover={{ scale: 1.2 }}
                    />
                  ) : (
                    <motion.div whileHover={{ scale: 1.2 }}>
                      <FaUser className="w-7 h-7 sm:w-9 sm:h-9 rounded-full text-gray-200 ring-2 ring-purple-400/50" />
                    </motion.div>
                  )}
                </div>
                <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-white leading-relaxed truncate">{friend.name}</span>
                {onlineFriends.has(friend._id) && (
                  <motion.span
                    className="absolute right-2 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  )}
</div>

      {/* Bottom Navigation Bar (hidden in full-screen mode) */}
      {!isFullScreen && (
        <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10">
          <AnimatePresence>
            {isNavbarCollapsed ? (
              <motion.div
                className="flex justify-center items-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={toggleNavbar}
                  className="p-2 sm:p-3 bg-yellow-300 text-gray-800 rounded-full glassmorphic tooltip"
                  data-tooltip="Open Menu"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Open navigation menu"
                >
                  <FaBookOpen size={16} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="flex bg-white/10 p-1 sm:p-1.5 rounded-full glassmorphic border border-white/20 shadow-lg"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              >
                <motion.button
                  onClick={() => handleTabChange("chats")}
                  className={`p-2 sm:p-2.5 mx-1 rounded-full ${activeTab === "chats" ? 'bg-purple-600' : 'bg-transparent'} text-white hover:bg-purple-500 transition-colors duration-300 tooltip`}
                  data-tooltip="Chats"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="View chats"
                >
                  <FaComments size={16} className="text-purple-400" />
                </motion.button>
                <motion.button
                  onClick={() => handleTabChange("search")}
                  className={`p-2 sm:p-2.5 mx-1 rounded-full ${activeTab === "search" ? 'bg-purple-600' : 'bg-transparent'} text-white hover:bg-purple-500 transition-colors duration-300 tooltip`}
                  data-tooltip="Search"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Search users"
                >
                  <FaSearch size={16} className="text-purple-400" />
                </motion.button>
                <motion.button
                  onClick={() => handleTabChange("requests")}
                  className={`p-2 sm:p-2.5 mx-1 rounded-full ${activeTab === "requests" ? 'bg-purple-600' : 'bg-transparent'} text-white hover:bg-purple-500 transition-colors duration-300 tooltip`}
                  data-tooltip="Friend Requests"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="View friend requests"
                >
                  <FaUsers size={16} className="text-purple-400" />
                </motion.button>
                <motion.button
                  onClick={toggleNavbar}
                  className="p-2 sm:p-2.5 mx-1 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300 tooltip"
                  data-tooltip="Close Menu"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close navigation menu"
                >
                  <FaTimes size={16} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Search Results Modal (hidden in full-screen mode) */}
      {!isFullScreen && (
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-2 sm:px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-labelledby="search-results-title"
            >
              <motion.div
                className="bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-2xl p-3 sm:p-4 w-full max-w-[90vw] sm:max-w-md glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              >
                <motion.h3
                  id="search-results-title"
                  className="text-base sm:text-lg lg:text-xl font-extrabold text-center text-white mb-3 sm:mb-4 drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Search Results
                </motion.h3>
                {loading ? (
                  <div className="space-y-2 sm:space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-full h-8 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs sm:text-sm text-center text-gray-200">No users found</p>
                ) : (
                  searchResults.map((user, index) => (
                    <motion.div
                      key={user._id}
                      className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 flex items-center justify-between glassmorphic border border-white/20 hover:border-purple-400 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                    >
                      <div className="flex items-center">
                        {user.profilePicture ? (
                          <motion.img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 sm:mr-3 ring-2 ring-purple-400/50"
                            whileHover={{ scale: 1.2 }}
                          />
                        ) : (
                          <motion.div whileHover={{ scale: 1.2 }}>
                            <FaUser className="w-7 h-7 sm:w-9 sm:h-9 rounded-full mr-2 sm:mr-3 text-gray-200 ring-2 ring-purple-400/50" />
                          </motion.div>
                        )}
                        <span className="text-xs sm:text-sm text-white leading-relaxed truncate">{user.name} ({user.uid})</span>
                      </div>
                      <motion.button
                        onClick={() => sendFriendRequest(user._id)}
                        disabled={loading}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-300 text-gray-800 hover:bg-yellow-400 rounded-lg sm:rounded-xl flex items-center glassmorphic text-xs sm:text-sm tooltip`}
                        data-tooltip="Send Friend Request"
                        whileHover={loading ? {} : { scale: 1.05, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                        whileTap={loading ? {} : { scale: 0.95 }}
                        aria-label="Send friend request"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <FaSpinner className="mr-1 text-xs" />
                          </motion.div>
                        ) : (
                          <FaUserPlus className="mr-1 text-xs" />
                        )}
                        {loading ? 'Sending…' : 'Send'}
                      </motion.button>
                    </motion.div>
                  ))
                )}
                <motion.button
                  className="mt-3 sm:mt-4 w-full py-1.5 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg sm:rounded-xl glassmorphic text-xs sm:text-sm tooltip"
                  data-tooltip="Close Modal"
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close search results"
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Full Image Modal */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullImage(null)}
            role="dialog"
            aria-label="Full image view"
          >
            <motion.img
              src={showFullImage}
              alt="Full view"
              className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
            <motion.button
              onClick={() => setShowFullImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-gray-800 rounded-full text-white hover:bg-gray-700"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close full image view"
            >
              <FaTimes size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :root {
          --primary-gradient: linear-gradient(to right, #4f46e5, #6b21a8);
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(255, 255, 255, 0.2);
          --text-primary: #ffffff;
          --text-secondary: #e5e7eb;
          --accent-yellow: #FFD700;
          --accent-purple: #9333ea;
        }

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }

        .animated-gradient {
          background: linear-gradient(270deg, #3b82f6, #9333ea);
          background-size: 400% 400%;
          animation: gradientAnimation 12s ease infinite;
        }

        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          animation: float 12s infinite ease-in-out;
          pointer-events: none;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-35vh) scale(0.7); }
        }

        .glassmorphic {
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
        }

        .glassmorphic-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .touch-pan-y {
          touch-action: pan-y;
        }

        .tooltip {
          position: relative;
        }

        .tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: var(--text-primary);
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 9px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          z-index: 10;
        }

        .tooltip:hover::after {
          opacity: 1;
          visibility: visible;
        }

        /* Responsive Adjustments */
        @media (max-width: 640px) {
          .animated-gradient {
            padding-bottom: 4rem;
          }

          .glassmorphic-panel {
            height: calc(100vh - 4rem);
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }

          .tooltip::after {
            font-size: 8px;
            padding: 2px 5px;
          }

          .particle {
            width: 1.5px;
            height: 1.5px;
          }
        }

        @media (min-width: 640px) and (max-width: 1024px) {
          .glassmorphic-panel {
            height: calc(100vh - 3.5rem);
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }

          .tooltip::after {
            font-size: 9px;
          }
        }

        @media (min-width: 768px) {
          .glassmorphic-panel {
            flex-direction: row;
          }
        }

        @media (max-width: 768px) {
          .flex-col.md\\:flex-row {
            flex-direction: column;
          }

          .md\\:w-72 {
            width: 100%;
          }

          .md\\:rounded-l-lg {
            border-radius: 0;
          }

          .md\\:rounded-tr-xl {
            border-top-right-radius: 0.5rem;
          }

          .md\\:rounded-br-xl {
            border-bottom-right-radius: 0.5rem;
          }
        }

        @media (min-width: 1024px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }

          .tooltip::after {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .motion-div, .motion-button, .motion-img, .motion-span {
            transition: none !important;
            animation: none !important;
          }

          .animated-gradient {
            animation: none !important;
            background: linear-gradient(270deg, #3b82f6, #9333ea);
          }

          .particle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FriendsPanel;