import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaInfoCircle,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaBookOpen,
  FaBars,
  FaTimes,
  FaHome,
  FaThLarge,
  FaCrown,
  FaGlobe,
  FaQuestionCircle,
  FaUsers, // Added for Friends icon
} from "react-icons/fa";
import { motion } from "framer-motion";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userImage, setUserImage] = useState(null);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");
  const nanoId = localStorage.getItem("nanoId") || "";
  const isPremium = localStorage.getItem("isPremium") === "true";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUserData = async () => {
        try {
          const API_BASE =
            window.location.hostname === "localhost"
              ? "http://localhost:5000"
              : "https://apnibook-backend.onrender.com";
          const res = await fetch(`${API_BASE}/api/auth/getuser`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": token,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUserName(data.name || "User");
            setUserImage(data.profilePicture || null);
          } else {
            console.error("Failed to fetch user data");
            setUserName("User");
            setUserImage(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName("User");
          setUserImage(null);
        }
      };
      fetchUserData();
    } else {
      setUserName("User");
      setUserImage(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nanoId");
    localStorage.removeItem("isPremium");
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2 rounded-md shadow-md"
      : "text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-all duration-300";

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const menuVariants = {
    open: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { staggerChildren: 0.07, delayChildren: 0.2, type: "spring", stiffness: 100 },
    },
    closed: {
      opacity: 0,
      y: -20,
      rotateX: -15,
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  };

  const itemVariants = {
    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
    closed: { y: 50, opacity: 0, transition: { y: { stiffness: 1000 } } },
  };

  const dropdownVariants = {
    open: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 300 } },
    closed: { opacity: 0, y: -10, rotateX: -15 },
  };

  const badgeVariants = {
    hover: { scale: 1.2, rotate: 10, transition: { type: "spring", stiffness: 400 } },
    initial: { scale: 1, rotate: 0 },
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="bg-gradient-to-r from-gray-800 via-gray-900 to-black shadow-2xl py-2"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-white text-2xl font-bold flex items-center transition-transform transform hover:scale-105"
            >
              <FaBookOpen className="mr-2 text-blue-400" />
              ApniNoteBook
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {token ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={nanoId ? `/${nanoId}/dashboard` : "/dashboard"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/dashboard` : "/dashboard"
                    )}`}
                  >
                    <FaThLarge className="text-xl" />
                    <span className="ml-2">Dashboard</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={nanoId ? `/${nanoId}/publishnotes` : "/publishnotes"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/publishnotes` : "/publishnotes"
                    )}`}
                  >
                    <FaGlobe className="text-xl" />
                    <span className="ml-2">Published Notes</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={nanoId ? `/${nanoId}/friends` : "/friends"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/friends` : "/friends"
                    )}`}
                  >
                    <FaUsers className="text-xl" />
                    <span className="ml-2">Friends</span>
                  </Link>
                </motion.div>
                {!isPremium && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={nanoId ? `/${nanoId}/upgrade` : "/upgrade"}
                      className={`group flex items-center text-green-300 hover:text-green-500 ${isActive(
                        nanoId ? `/${nanoId}/upgrade` : "/upgrade"
                      )}`}
                    >
                      <FaCrown className="text-xl" />
                      <span className="ml-2">Upgrade</span>
                    </Link>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/" className={`group flex items-center ${isActive("/")}`}>
                    <FaHome className="text-xl" />
                    <span className="ml-2">Home</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/about" className={`group flex items-center ${isActive("/about")}`}>
                    <FaInfoCircle className="text-xl" />
                    <span className="ml-2">About</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/contact" className={`group flex items-center ${isActive("/contact")}`}>
                    <FaMapMarkerAlt className="text-xl" />
                    <span className="ml-2">Contact</span>
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!token ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" className={`group flex items-center ${isActive("/login")}`}>
                    <FaSignInAlt className="text-xl" />
                    <span className="ml-2">Login</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" className={`group flex items-center ${isActive("/signup")}`}>
                    <FaUserPlus className="text-xl" />
                    <span className="ml-2">Sign Up</span>
                  </Link>
                </motion.div>
              </>
            ) : (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-white hover:text-gray-200 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="h-8 w-8 rounded-full overflow-hidden mr-2 border-2 border-blue-400"
                    whileHover={{ scale: 1.1 }}
                  >
                    {userImage ? (
                      <img src={userImage} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                  <span>{userName}</span>
                  {isPremium && (
                    <motion.span
                      variants={badgeVariants}
                      initial="initial"
                      whileHover="hover"
                      className="ml-1 text-yellow-400 relative group"
                      aria-label="Premium User"
                    >
                      <FaCrown className="text-lg" />
                      <span className="absolute hidden group-hover:block text-xs text-white bg-gray-900 px-2 py-1 rounded-md -top-8 left-1/2 transform -translate-x-1/2">
                        Premium
                      </span>
                    </motion.span>
                  )}
                </motion.button>
                {isUserMenuOpen && (
                  <motion.div
                    ref={dropdownRef}
                    variants={dropdownVariants}
                    initial="closed"
                    animate={isUserMenuOpen ? "open" : "closed"}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50"
                    style={{ transformOrigin: "top" }}
                  >
                    <Link
                      to={nanoId ? `/${nanoId}/profile` : "/profile"}
                      className={`flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 ${isActive(
                        nanoId ? `/${nanoId}/profile` : "/profile"
                      )}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="h-6 w-6 rounded-full overflow-hidden mr-2 border-2 border-blue-400">
                        {userImage ? (
                          <img src={userImage} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      Profile
                    </Link>
                    <Link
                      to={nanoId ? `/${nanoId}/friends` : "/friends"}
                      className={`flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 ${isActive(
                        nanoId ? `/${nanoId}/friends` : "/friends"
                      )}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaUsers className="mr-2" />
                      Friends
                    </Link>
                    <Link
                      to="/about"
                      className={`flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 ${isActive("/about")}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaInfoCircle className="mr-2" />
                      About
                    </Link>
                    <Link
                      to="/contact"
                      className={`flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 ${isActive("/contact")}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaMapMarkerAlt className="mr-2" />
                      Contact
                    </Link>
                    <Link
                      to="/help"
                      className={`flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 ${isActive("/help")}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FaQuestionCircle className="mr-2" />
                      Help
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-md"
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate={isMenuOpen ? "open" : "closed"}
            className="md:hidden space-y-4 mt-4 px-4 py-4 bg-gray-800 rounded-md shadow-lg"
            style={{ transformOrigin: "top" }}
          >
            {token ? (
              <>
                <motion.div variants={itemVariants}>
                  <Link
                    to={nanoId ? `/${nanoId}/dashboard` : "/dashboard"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/dashboard` : "/dashboard"
                    )}`}
                  >
                    <FaThLarge className="text-xl" />
                    <span className="ml-2">Dashboard</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link
                    to={nanoId ? `/${nanoId}/publishnotes` : "/publishnotes"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/publishnotes` : "/publishnotes"
                    )}`}
                  >
                    <FaGlobe className="text-xl" />
                    <span className="ml-2">Published Notes</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link
                    to={nanoId ? `/${nanoId}/friends` : "/friends"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/friends` : "/friends"
                    )}`}
                  >
                    <FaUsers className="text-xl" />
                    <span className="ml-2">Friends</span>
                  </Link>
                </motion.div>
                {!isPremium && (
                  <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={nanoId ? `/${nanoId}/upgrade` : "/upgrade"}
                      className={`group flex items-center text-green-300 hover:text-green-500 ${isActive(
                        nanoId ? `/${nanoId}/upgrade` : "/upgrade"
                      )}`}
                    >
                      <FaCrown className="text-xl" />
                      <span className="ml-2">Upgrade</span>
                    </Link>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Link
                    to={nanoId ? `/${nanoId}/profile` : "/profile"}
                    className={`group flex items-center ${isActive(
                      nanoId ? `/${nanoId}/profile` : "/profile"
                    )}`}
                  >
                    <div className="h-6 w-6 rounded-full overflow-hidden mr-2 border-2 border-blue-400">
                      {userImage ? (
                        <img src={userImage} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="ml-2">Profile</span>
                    {isPremium && (
                      <motion.span
                        variants={badgeVariants}
                        initial="initial"
                        whileHover="hover"
                        className="ml-2 text-yellow-400 relative group"
                        aria-label="Premium User"
                      >
                        <FaCrown className="text-lg" />
                        <span className="absolute hidden group-hover:block text-xs text-white bg-gray-900 px-2 py-1 rounded-md -top-8 left-1/2 transform -translate-x-1/2">
                          Premium
                        </span>
                      </motion.span>
                    )}
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/about" className={`group flex items-center ${isActive("/about")}`}>
                    <FaInfoCircle className="text-xl" />
                    <span className="ml-2">About</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/contact" className={`group flex items-center ${isActive("/contact")}`}>
                    <FaMapMarkerAlt className="text-xl" />
                    <span className="ml-2">Contact</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/help" className={`group flex items-center ${isActive("/help")}`}>
                    <FaQuestionCircle className="text-xl" />
                    <span className="ml-2">Help</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <FaSignOutAlt className="text-xl" />
                    <span className="ml-2">Logout</span>
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <Link to="/" className={`group flex items-center ${isActive("/")}`}>
                    <FaHome className="text-xl" />
                    <span className="ml-2">Home</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/about" className={`group flex items-center ${isActive("/about")}`}>
                    <FaInfoCircle className="text-xl" />
                    <span className="ml-2">About</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/contact" className={`group flex items-center ${isActive("/contact")}`}>
                    <FaMapMarkerAlt className="text-xl" />
                    <span className="ml-2">Contact</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/login" className={`group flex items-center ${isActive("/login")}`}>
                    <FaSignInAlt className="text-xl" />
                    <span className="ml-2">Login</span>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/signup" className={`group flex items-center ${isActive("/signup")}`}>
                    <FaUserPlus className="text-xl" />
                    <span className="ml-2">Sign Up</span>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;