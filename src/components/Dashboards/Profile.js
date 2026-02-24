import React, { useState, useEffect, useContext } from 'react';
import NoteContext from '../../context/notes/NoteContext';
import { Star, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBookOpen } from "react-icons/fa";

const Profile = ({ showAlert }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isChangingName, setIsChangingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [otpForEmail, setOtpForEmail] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isChangingPicture, setIsChangingPicture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { notes, getNotes } = useContext(NoteContext);

  // Compress image using canvas
  const compressImage = (file, maxSize = 500) => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection and conversion to base64
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showAlert('Please upload a JPEG, PNG, or GIF image.', 'danger');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAlert('Image size must be less than 2MB.', 'danger');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setProfilePicture(compressedBase64);
      setPreviewUrl(compressedBase64);
    } catch (err) {
      showAlert('Failed to process image.', 'danger');
    }
  };

  // Handle image upload
  const handleUploadPicture = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://apnibook-backend.onrender.com';
      const res = await fetch(`${API_BASE}/api/auth/update-profile-picture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token,
        },
        body: JSON.stringify({ profilePicture }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile picture.');
      }
      const data = await res.json();
      setUser((prev) => ({ ...prev, profilePicture }));
      showAlert('Profile picture updated successfully.', 'success');
      setIsChangingPicture(false);
      setPreviewUrl(null);
    } catch (err) {
      showAlert(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image deletion
  const handleDeletePicture = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://apnibook-backend.onrender.com';
      const res = await fetch(`${API_BASE}/api/auth/delete-profile-picture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete profile picture.');
      }
      setUser((prev) => ({ ...prev, profilePicture: null }));
      showAlert('Profile picture deleted successfully.', 'success');
      setPreviewUrl(null);
      setProfilePicture(null);
    } catch (err) {
      showAlert(err.message, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://apnibook-backend.onrender.com";
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/auth/getuser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setUser(data);
        setNewName(data.name);
        setNewEmail(data.email);
        setPreviewUrl(data.profilePicture || null);
        getNotes();
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line
  }, []);

  const handleChangeName = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";
      const res = await fetch(`${API_BASE}/api/auth/change-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change name.");
      }
      setUser((prev) => ({ ...prev, name: newName }));
      showAlert("Name changed successfully.", "success");
      setIsChangingName(false);
    } catch (err) {
      showAlert(err.message, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateEmailChange = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";
      const res = await fetch(`${API_BASE}/api/auth/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ email: newEmail, password: currentPasswordForEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initiate email change.");
      }
      setIsVerifyingEmail(true);
      showAlert("OTP sent to your new email.", "success");
    } catch (err) {
      showAlert(err.message, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";
      const res = await fetch(`${API_BASE}/api/auth/verify-email-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ email: newEmail, otp: otpForEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to verify OTP.");
      }
      setUser((prev) => ({ ...prev, email: newEmail }));
      showAlert("Email changed successfully.", "success");
      setIsChangingEmail(false);
      setIsVerifyingEmail(false);
    } catch (err) {
      showAlert(err.message, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      showAlert("New passwords do not match.", "danger");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://apnibook-backend.onrender.com";
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password.");
      }
      showAlert("Password changed successfully.", "success");
      setIsChangingPassword(false);
    } catch (err) {
      showAlert(err.message, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-700">
        <motion.div
          className="h-16 w-16 border-4 border-t-transparent border-white rounded-full"
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="p-8 bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl text-white text-center border border-white/30"
        >
          Unable to load profile.
        </motion.div>
      </div>
    );
  }

  const formattedDate = new Date(user.date).toLocaleDateString();
  const noteCount = Array.isArray(notes) ? notes.length : 0;

  const tabs = [
    { id: 'profile', label: 'Overview' },
    { id: 'settings', label: 'Edit Profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-700 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaBookOpen className="text-3xl sm:text-4xl text-yellow-300 mr-3" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">ApniNoteBook</h1>
          </div>
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors border border-white/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
            <Settings className="h-6 w-6 text-white relative z-10" />
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateX: 15 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-1 bg-white/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30 relative overflow-hidden"
            style={{ transform: 'perspective(1200px)' }}
          >
            {/* Parallax Background Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              whileHover={{ scale: 1.03, rotateX: -5 }}
              transition={{ duration: 0.4 }}
              className="text-center relative z-10"
            >
              <div className="relative mx-auto h-36 w-36 sm:h-48 sm:w-48 rounded-full overflow-hidden border-4 border-white/40 shadow-lg">
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-5xl sm:text-6xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </motion.div>
              </div>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 text-2xl sm:text-3xl font-bold text-white"
              >
                {user.name}
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-sm sm:text-base text-gray-200 break-all"
              >
                {user.email}
              </motion.p>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-4 flex justify-center items-center gap-2"
              >
                {user.isPremium && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Star className="h-5 w-5 text-yellow-400" />
                  </motion.div>
                )}
                <span className="text-sm sm:text-base font-medium text-white">{user.isPremium ? 'Premium' : 'Free'}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 bg-white/10 p-4 rounded-xl text-gray-200 text-sm sm:text-base"
              >
                <motion.p
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <span className="font-medium">UID:</span> {user.uid}
                </motion.p>
                <motion.p
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <span className="font-medium">Member Since:</span> {formattedDate}
                </motion.p>
                <motion.p
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                >
                  <span className="font-medium">Notes Created:</span> {noteCount}
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Settings Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateX: -15 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-2 bg-white/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30 relative overflow-hidden"
            style={{ transform: 'perspective(1200px)' }}
          >
            {/* Parallax Background Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative z-10">
              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="flex flex-wrap gap-3">
                      {tabs.map((tab) => (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-all shadow-md relative overflow-hidden ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'bg-white/10 text-gray-200 hover:bg-white/20'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                          <span className="relative z-10">{tab.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl sm:text-3xl font-bold text-white"
                  >
                    Profile Overview
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/10 p-6 rounded-xl shadow-md"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="flex items-center gap-4"
                    >
                      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/40">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                          className="text-lg font-semibold text-white"
                        >
                          {user.name}
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          className="text-sm text-gray-200 break-all"
                        >
                          {user.email}
                        </motion.p>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="mt-4 text-gray-200 text-sm sm:text-base"
                    >
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                      >
                        <span className="font-medium">UID:</span> {user.uid}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                      >
                        <span className="font-medium">Member Since:</span> {formattedDate}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                      >
                        <span className="font-medium">Notes Created:</span> {noteCount}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 1.0 }}
                      >
                        <span className="font-medium">Status:</span>{' '}
                        <span className="inline-flex items-center gap-1">
                          {user.isPremium ? 'Premium' : 'Free'}
                          {user.isPremium && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Star className="h-4 w-4 text-yellow-400" />
                            </motion.div>
                          )}
                        </span>
                      </motion.p>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {/* Profile Picture */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white/10 p-6 rounded-xl shadow-md"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Profile Picture</h3>
                    {isChangingPicture ? (
                      <div className="space-y-4">
                        {previewUrl && (
                          <motion.img
                            src={previewUrl}
                            alt="Preview"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto border-4 border-white/40 shadow-lg"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          />
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handleImageChange}
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            onClick={handleUploadPicture}
                            disabled={isLoading || !profilePicture}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Upload</span>
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setIsChangingPicture(false);
                              setPreviewUrl(user.profilePicture || null);
                              setProfilePicture(null);
                            }}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Cancel</span>
                          </motion.button>
                          {user.profilePicture && (
                            <motion.button
                              onClick={handleDeletePicture}
                              disabled={isLoading}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-red-500/50 text-red-100 rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-red-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                              <span className="relative z-10">Delete</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm sm:text-base">
                        Status: {user.profilePicture ? 'Set' : 'Not set'}
                        <motion.button
                          onClick={() => setIsChangingPicture(true)}
                          whileHover={{ scale: 1.1 }}
                          className="ml-4 text-blue-400 hover:text-blue-300 text-sm sm:text-base relative"
                        >
                          Change
                          <span className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-full" />
                        </motion.button>
                      </p>
                    )}
                  </motion.div>

                  {/* Change Name */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/10 p-6 rounded-xl shadow-md"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Name</h3>
                    {isChangingName ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                          placeholder="New Name"
                        />
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            onClick={handleChangeName}
                            disabled={isLoading}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Save</span>
                          </motion.button>
                          <motion.button
                            onClick={() => setIsChangingName(false)}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Cancel</span>
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm sm:text-base">
                        Name: {user.name}
                        <motion.button
                          onClick={() => setIsChangingName(true)}
                          whileHover={{ scale: 1.1 }}
                          className="ml-4 text-blue-400 hover:text-blue-300 text-sm sm:text-base relative"
                        >
                          Change
                          <span className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-full" />
                        </motion.button>
                      </p>
                    )}
                  </motion.div>

                  {/* Change Email */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white/10 p-6 rounded-xl shadow-md"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Email</h3>
                    {isChangingEmail ? (
                      <div className="space-y-4">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="New Email"
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                        />
                        <input
                          type="password"
                          value={currentPasswordForEmail}
                          onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                          placeholder="Current Password"
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                        />
                        <motion.button
                          onClick={handleInitiateEmailChange}
                          disabled={isLoading}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                          <span className="relative z-10">Send OTP</span>
                        </motion.button>
                        {isVerifyingEmail && (
                          <div className="space-y-4 mt-4">
                            <input
                              type="text"
                              value={otpForEmail}
                              onChange={(e) => setOtpForEmail(e.target.value)}
                              placeholder="Enter OTP"
                              className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                            />
                            <motion.button
                              onClick={handleVerifyEmailOTP}
                              disabled={isLoading}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                              <span className="relative z-10">Verify</span>
                            </motion.button>
                          </div>
                        )}
                        <motion.button
                          onClick={() => setIsChangingEmail(false)}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 text-sm sm:text-base shadow-md relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                          <span className="relative z-10">Cancel</span>
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm sm:text-base">
                        Email: {user.email}
                        <motion.button
                          onClick={() => setIsChangingEmail(true)}
                          whileHover={{ scale: 1.1 }}
                          className="ml-4 text-blue-400 hover:text-blue-300 text-sm sm:text-base relative"
                        >
                          Change
                          <span className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-full" />
                        </motion.button>
                      </p>
                    )}
                  </motion.div>

                  {/* Change Password */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white/10 p-6 rounded-xl shadow-md"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Password</h3>
                    {isChangingPassword ? (
                      <div className="space-y-4">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current Password"
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                        />
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm New Password"
                          className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
                        />
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            onClick={handleChangePassword}
                            disabled={isLoading}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Change Password</span>
                          </motion.button>
                          <motion.button
                            onClick={() => setIsChangingPassword(false)}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 text-sm sm:text-base shadow-md relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 hover:opacity-30 transition-opacity duration-300" />
                            <span className="relative z-10">Cancel</span>
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm sm:text-base">
                        Password: ********
                        <motion.button
                          onClick={() => setIsChangingPassword(true)}
                          whileHover={{ scale: 1.1 }}
                          className="ml-4 text-blue-400 hover:text-blue-300 text-sm sm:text-base relative"
                        >
                          Change
                          <span className="absolute inset-0 bg-blue-400 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-full" />
                        </motion.button>
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;