import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { ReactTyped as Typed } from "react-typed";
import {
  FaChartBar,
  FaUsers,
  FaBook,
  FaExclamationTriangle,
  FaClipboardList,
  FaFileExport,
  FaCrown,
  FaEye,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheck,
  FaSun,
  FaMoon,
  FaTimes,
  FaUndo,
  FaFlag,
  FaStickyNote,
  FaSignOutAlt,
  FaChartLine,
  FaBars,
  FaBookOpen,
  FaCircle,
} from "react-icons/fa";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState("light");
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [overviewData, setOverviewData] = useState({
    totalUsers: 0,
    totalNotes: 0,
    premiumUsers: 0,
    freeUsers: 0,
    dailySignups: 0,
    dailyNotes: 0,
  });
  const [usersData, setUsersData] = useState([]);
  const [notesData, setNotesData] = useState([]);
  const [moderationData, setModerationData] = useState([]);
  const [logsData, setLogsData] = useState([]);
  const [reportsData, setReportsData] = useState({ userExport: "N/A", noteExport: "N/A" });
  const [premiumData, setPremiumData] = useState({
    totalPremium: 0,
    freeUsageRemaining: { ai: 0, voice: 0, export: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://apnibook-backend.onrender.com/api/admin"
      : "http://localhost:5000/api/admin";

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Sidebar resizing handlers
  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleMouseMove = useCallback(
    (e) => {
      if (isResizing && !isSidebarCollapsed) {
        const newWidth = Math.min(Math.max(e.clientX, 200), 400);
        setSidebarWidth(newWidth);
      }
    },
    [isResizing, isSidebarCollapsed]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove]);

  const fetchData = useCallback(async (endpoint, setter, defaultData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseURL}/${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token") || "",
        },
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Error fetching ${endpoint}`);
      setter(data);
    } catch (err) {
      setError(err.message);
      setter(defaultData);
    } finally {
      setLoading(false);
    }
  }, []);

  const performAction = useCallback(async (method, endpoint, body = null) => {
    setLoading(true);
    setError(null);
    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token") || "",
        },
      };
      if (body) options.body = JSON.stringify(body);
      const response = await fetch(`${baseURL}/${endpoint}`, options);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Error performing ${method} on ${endpoint}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const defaultDataMap = {
      overview: { totalUsers: 0, totalNotes: 0, premiumUsers: 0, freeUsers: 0, dailySignups: 0, dailyNotes: 0 },
      users: [],
      notes: [],
      moderation: [],
      logs: [],
      reports: { userExport: "N/A", noteExport: "N/A" },
      premium: { totalPremium: 0, freeUsageRemaining: { ai: 0, voice: 0, export: 0 } },
    };
    switch (activeTab) {
      case "overview": fetchData("overview", setOverviewData, defaultDataMap.overview); break;
      case "users": fetchData("users", setUsersData, defaultDataMap.users); break;
      case "notes": fetchData("notes", setNotesData, defaultDataMap.notes); break;
      case "moderation": fetchData("moderation", setModerationData, defaultDataMap.moderation); break;
      case "logs": fetchData("logs", setLogsData, defaultDataMap.logs); break;
      case "reports": fetchData("reports", setReportsData, defaultDataMap.reports); break;
      case "premium": fetchData("premium", setPremiumData, defaultDataMap.premium); break;
      default: break;
    }
  }, [activeTab, fetchData]);

  const handleAction = useCallback(async (action, type, id) => {
    try {
      if (type === "user") {
        if (action === "disable") {
          await performAction("PUT", `users/${id}`, { isActive: false });
          setUsersData(usersData.map(u => u.uid === id ? { ...u, isActive: false } : u));
          alert("User disabled successfully");
        } else if (action === "enable") {
          await performAction("PUT", `users/${id}`, { isActive: true });
          setUsersData(usersData.map(u => u.uid === id ? { ...u, isActive: true } : u));
          alert("User enabled successfully");
        } else if (action === "delete") {
          if (window.confirm("Are you sure you want to delete this user?")) {
            await performAction("DELETE", `users/${id}`);
            setUsersData(usersData.filter(u => u.uid !== id));
            alert("User deleted successfully");
          }
        } else if (action === "view") {
          const user = usersData.find(u => u.uid === id);
          if (user) {
            setModalContent(
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-sans">User Details</h3>
                <div className="grid grid-cols-1 gap-4 text-gray-700 dark:text-gray-300">
                  <p><strong>UID:</strong> {user.uid}</p>
                  <p><strong>Name:</strong> {user.name || "N/A"}</p>
                  <p><strong>Email:</strong> {user.email || "N/A"}</p>
                  <p><strong>Premium:</strong> {user.isPremium ? "Yes" : "No"}</p>
                  <p><strong>Join Date:</strong> {user.date ? format(new Date(user.date), "PPP") : "N/A"}</p>
                  <p><strong>Notes Count:</strong> {user.notesCount || 0}</p>
                  <p><strong>Status:</strong> {user.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            );
            setIsModalOpen(true);
          }
        } else if (action === "togglePremium") {
          const user = usersData.find(u => u.uid === id);
          if (user) {
            const newPremiumStatus = !user.isPremium;
            await performAction("PUT", `users/${id}`, { isPremium: newPremiumStatus });
            setUsersData(usersData.map(u => u.uid === id ? { ...u, isPremium: newPremiumStatus } : u));
            alert(`Premium status ${newPremiumStatus ? "granted" : "revoked"} successfully`);
          }
        } else if (action === "edit") {
          const user = usersData.find(u => u.uid === id);
          if (user) {
            setModalContent(
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-sans">Edit User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      onChange={e => (user.name = e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      onChange={e => (user.email = e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      onClick={async () => {
                        if (!user.name || !user.email) {
                          alert("Name and email are required");
                          return;
                        }
                        await performAction("PUT", `users/${id}`, { name: user.name, email: user.email });
                        setUsersData(usersData.map(u => u.uid === id ? { ...u, name: user.name, email: user.email } : u));
                        setIsModalOpen(false);
                        alert("User updated successfully");
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
            setIsModalOpen(true);
          }
        }
      } else if (type === "note") {
        if (action === "delete") {
          await performAction("PUT", `notes/${id}`, { isDeleted: true });
          setNotesData(notesData.map(n => n.uid === id ? { ...n, isDeleted: true } : n));
          alert("Note deleted successfully");
        } else if (action === "restore") {
          await performAction("PUT", `notes/${id}`, { isDeleted: false });
          setNotesData(notesData.map(n => n.uid === id ? { ...n, isDeleted: false } : n));
          alert("Note restored successfully");
        } else if (action === "view") {
          const note = notesData.find(n => n.uid === id);
          if (note) {
            setModalContent(
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-sans">Note Details</h3>
                <div className="grid grid-cols-1 gap-4 text-gray-700 dark:text-gray-300">
                  <p><strong>UID:</strong> {note.uid}</p>
                  <p><strong>Title:</strong> {note.title || "N/A"}</p>
                  <p><strong>User:</strong> {note.user || "N/A"}</p>
                  <p><strong>Tag:</strong> {note.tag || "N/A"}</p>
                  <p><strong>Date:</strong> {note.date ? format(new Date(note.date), "PPP") : "N/A"}</p>
                  <p><strong>Public:</strong> {note.isPublic ? "Yes" : "No"}</p>
                  <p><strong>Deleted:</strong> {note.isDeleted ? "Yes" : "No"}</p>
                  <p><strong>Flagged:</strong> {note.isFlagged ? "Yes" : "No"}</p>
                </div>
              </div>
            );
            setIsModalOpen(true);
          }
        } else if (action === "flag") {
          await performAction("PUT", `notes/${id}`, { isFlagged: true });
          const updatedNote = { ...notesData.find(n => n.uid === id), isFlagged: true, flaggedDate: new Date() };
          setNotesData(notesData.map(n => n.uid === id ? updatedNote : n));
          setModerationData([...moderationData, updatedNote]);
          alert("Note flagged successfully");
        } else if (action === "unflag") {
          await performAction("PUT", `notes/${id}`, { isFlagged: false });
          setNotesData(notesData.map(n => n.uid === id ? { ...n, isFlagged: false, flaggedDate: null } : n));
          setModerationData(moderationData.filter(n => n.uid !== id));
          alert("Note unflagged successfully");
        } else if (action === "edit") {
          const note = notesData.find(n => n.uid === id);
          if (note) {
            setModalContent(
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-sans">Edit Note</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                      type="text"
                      defaultValue={note.title}
                      onChange={e => (note.title = e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag</label>
                    <input
                      type="text"
                      defaultValue={note.tag}
                      onChange={e => (note.tag = e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      onClick={async () => {
                        if (!note.title || !note.tag) {
                          alert("Title and tag are required");
                          return;
                        }
                        await performAction("PUT", `notes/${id}`, { title: note.title, tag: note.tag });
                        setNotesData(notesData.map(n => 
                          n.uid === id ? { ...n, title: note.title, tag: note.tag } : n
                        ));
                        setIsModalOpen(false);
                        alert("Note updated successfully");
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
            setIsModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  }, [usersData, notesData, moderationData, performAction]);

  const menuItems = useMemo(() => [
    { key: "overview", label: "Overview", icon: <FaChartBar size={20} /> },
    { key: "users", label: "Users", icon: <FaUsers size={20} /> },
    { key: "notes", label: "Notes", icon: <FaBook size={20} /> },
    { key: "moderation", label: "Moderation", icon: <FaExclamationTriangle size={20} /> },
    { key: "logs", label: "Logs", icon: <FaClipboardList size={20} /> },
    { key: "reports", label: "Reports", icon: <FaFileExport size={20} /> },
    { key: "premium", label: "Premium", icon: <FaCrown size={20} /> },
  ], []);

  const renderPanel = useCallback(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <CircularProgress size={48} className="text-blue-600 animate-pulse" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-300 animate-fade-in font-sans">
          Error: {error}
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        const stats = [
          { title: "Total Users", value: overviewData.totalUsers, icon: <FaUsers className="text-blue-500" size={24} /> },
          { title: "Total Notes", value: overviewData.totalNotes, icon: <FaBook className="text-green-500" size={24} /> },
          { title: "Premium Users", value: overviewData.premiumUsers, icon: <FaCrown className="text-yellow-500" size={24} /> },
          { title: "Free Users", value: overviewData.freeUsers, icon: <FaUsers className="text-gray-500" size={24} /> },
          { title: "Daily Signups", value: overviewData.dailySignups, icon: <FaChartLine className="text-purple-500" size={24} /> },
          { title: "Daily Notes", value: overviewData.dailyNotes, icon: <FaStickyNote className="text-orange-500" size={24} /> },
        ];
        return (
          <div className="p-8 space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-sans">Overview & Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 font-sans">{item.title}</h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-3 font-sans">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "users":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">User Management</h2>
                {usersData.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse hidden md:table">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          {["UID", "Name", "Email", "Premium", "Join Date", "Notes", "Status", "Actions"].map(header => (
                            <th
                              key={header}
                              className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider font-sans"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersData.map((user, index) => (
                          <tr
                            key={user.uid}
                            className={`${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                            } hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200`}
                          >
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px] font-sans" title={user.uid}>
                              {user.uid}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{user.name || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] font-sans" title={user.email}>
                              {user.email || "N/A"}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  user.isPremium
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <FaCircle size={8} className={user.isPremium ? 'text-green-500' : 'text-gray-500'} />
                                <span>{user.isPremium ? 'Premium' : 'Standard'}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">
                              {user.date ? format(new Date(user.date), "PPP") : "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{user.notesCount || 0}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  user.isActive
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                              >
                                <FaCircle size={8} className={user.isActive ? 'text-blue-500' : 'text-red-500'} />
                                <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <div className="relative group">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("view", "user", user.uid)}
                                  >
                                    <FaEye className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("edit", "user", user.uid)}
                                  >
                                    <FaEdit className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Edit</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className={`p-2 ${
                                      user.isPremium
                                        ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                                        : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                                    } rounded-full transition-all duration-200`}
                                    onClick={() => handleAction("togglePremium", "user", user.uid)}
                                  >
                                    {user.isPremium ? <FaTimes className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">
                                    {user.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                                  </span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className={`p-2 ${
                                      user.isActive
                                        ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                                        : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                                    } rounded-full transition-all duration-200`}
                                    onClick={() => handleAction(user.isActive ? "disable" : "enable", "user", user.uid)}
                                  >
                                    {user.isActive ? <FaBan className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">
                                    {user.isActive ? 'Disable' : 'Enable'}
                                  </span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("delete", "user", user.uid)}
                                  >
                                    <FaTrash className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="md:hidden space-y-4">
                      {usersData.map((user) => (
                        <div
                          key={user.uid}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>UID:</strong> {user.uid}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Name:</strong> {user.name || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>Email:</strong> {user.email || "N/A"}
                            </p>
                            <p className="text-sm font-sans">
                              <strong>Premium:</strong>
                              <span
                                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  user.isPremium
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <FaCircle size={8} className={user.isPremium ? 'text-green-500' : 'text-gray-500'} />
                                <span>{user.isPremium ? 'Premium' : 'Standard'}</span>
                              </span>
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Join Date:</strong> {user.date ? format(new Date(user.date), "PPP") : "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Notes:</strong> {user.notesCount || 0}
                            </p>
                            <p className="text-sm font-sans">
                              <strong>Status:</strong>
                              <span
                                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  user.isActive
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                              >
                                <FaCircle size={8} className={user.isActive ? 'text-blue-500' : 'text-red-500'} />
                                <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <div className="relative group">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("view", "user", user.uid)}
                              >
                                <FaEye className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                            </div>
                            <div className="relative group">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("edit", "user", user.uid)}
                              >
                                <FaEdit className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Edit</span>
                            </div>
                            <div className="relative group">
                              <button
                                className={`p-2 ${
                                  user.isPremium
                                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                                    : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                                } rounded-full transition-all duration-200`}
                                onClick={() => handleAction("togglePremium", "user", user.uid)}
                              >
                                {user.isPremium ? <FaTimes className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">
                                {user.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                              </span>
                            </div>
                            <div className="relative group">
                              <button
                                className={`p-2 ${
                                  user.isActive
                                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                                    : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                                } rounded-full transition-all duration-200`}
                                onClick={() => handleAction(user.isActive ? "disable" : "enable", "user", user.uid)}
                              >
                                {user.isActive ? <FaBan className="w-5 h-5" /> : <FaCheck className="w-5 h-5" />}
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">
                                {user.isActive ? 'Disable' : 'Enable'}
                              </span>
                            </div>
                            <div className="relative group">
                              <button
                                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                                onClick={() => handleAction("delete", "user", user.uid)}
                              >
                                <FaTrash className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FaUsers className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100 font-sans">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-sans">
                      Get started by adding a new user.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">Note Management</h2>
                {notesData.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse hidden md:table">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          {["UID", "Title", "User", "Tag", "Date", "Public", "Deleted", "Actions"].map(header => (
                            <th
                              key={header}
                              className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider font-sans"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {notesData.map((note, index) => (
                          <tr
                            key={note.uid}
                            className={`${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                            } hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200`}
                          >
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px] font-sans" title={note.uid}>
                              {note.uid}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] font-sans" title={note.title}>
                              {note.title || "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px] font-sans" title={note.user}>
                              {note.user || "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{note.tag || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">
                              {note.date ? format(new Date(note.date), "PPP") : "N/A"}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  note.isPublic
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <FaCircle size={8} className={note.isPublic ? 'text-green-500' : 'text-gray-500'} />
                                <span>{note.isPublic ? 'Public' : 'Private'}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  note.isDeleted
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}
                              >
                                <FaCircle size={8} className={note.isDeleted ? 'text-red-500' : 'text-blue-500'} />
                                <span>{note.isDeleted ? 'Deleted' : 'Active'}</span>
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <div className="relative group">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("view", "note", note.uid)}
                                  >
                                    <FaEye className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("edit", "note", note.uid)}
                                  >
                                    <FaEdit className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Edit</span>
                                </div>
                                {note.isDeleted ? (
                                  <div className="relative group">
                                    <button
                                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full transition-all duration-200"
                                      onClick={() => handleAction("restore", "note", note.uid)}
                                    >
                                      <FaUndo className="w-5 h-5" />
                                    </button>
                                    <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Restore</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative group">
                                      <button
                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all duration-200"
                                        onClick={() => handleAction("delete", "note", note.uid)}
                                      >
                                        <FaTrash className="w-5 h-5" />
                                      </button>
                                      <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                                    </div>
                                    <div className="relative group">
                                      <button
                                        className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full transition-all duration-200"
                                        onClick={() => handleAction("flag", "note", note.uid)}
                                      >
                                        <FaFlag className="w-5 h-5" />
                                      </button>
                                      <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Flag</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="md:hidden space-y-4">
                      {notesData.map((note) => (
                        <div
                          key={note.uid}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>UID:</strong> {note.uid}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>Title:</strong> {note.title || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>User:</strong> {note.user || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Tag:</strong> {note.tag || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Date:</strong> {note.date ? format(new Date(note.date), "PPP") : "N/A"}
                            </p>
                            <p className="text-sm font-sans">
                              <strong>Public:</strong>
                              <span
                                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  note.isPublic
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <FaCircle size={8} className={note.isPublic ? 'text-green-500' : 'text-gray-500'} />
                                <span>{note.isPublic ? 'Public' : 'Private'}</span>
                              </span>
                            </p>
                            <p className="text-sm font-sans">
                              <strong>Deleted:</strong>
                              <span
                                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                  note.isDeleted
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}
                              >
                                <FaCircle size={8} className={note.isDeleted ? 'text-red-500' : 'text-blue-500'} />
                                <span>{note.isDeleted ? 'Deleted' : 'Active'}</span>
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <div className="relative group">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("view", "note", note.uid)}
                              >
                                <FaEye className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                            </div>
                            <div className="relative group">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("edit", "note", note.uid)}
                              >
                                <FaEdit className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Edit</span>
                            </div>
                            {note.isDeleted ? (
                              <div className="relative group">
                                <button
                                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full transition-all duration-200"
                                  onClick={() => handleAction("restore", "note", note.uid)}
                                >
                                  <FaUndo className="w-5 h-5" />
                                </button>
                                <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Restore</span>
                              </div>
                            ) : (
                              <>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("delete", "note", note.uid)}
                                  >
                                    <FaTrash className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("flag", "note", note.uid)}
                                  >
                                    <FaFlag className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Flag</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FaStickyNote className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100 font-sans">No notes found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-sans">
                      Get started by creating a new note.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "moderation":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">Content Moderation</h2>
                {moderationData.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse hidden md:table">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          {["Note UID", "Title", "User", "Flagged Date", "Actions"].map(header => (
                            <th
                              key={header}
                              className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider font-sans"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {moderationData.map((note, index) => (
                          <tr
                            key={note.uid}
                            className={`${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                            } hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200`}
                          >
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px] font-sans" title={note.uid}>
                              {note.uid}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] font-sans" title={note.title}>
                              {note.title || "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px] font-sans" title={note.user}>
                              {note.user || "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">
                              {note.flaggedDate ? format(new Date(note.flaggedDate), "PPP") : "N/A"}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                <div className="relative group">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("view", "note", note.uid)}
                                  >
                                    <FaEye className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("unflag", "note", note.uid)}
                                  >
                                    <FaFlag className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Unflag</span>
                                </div>
                                <div className="relative group">
                                  <button
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all duration-200"
                                    onClick={() => handleAction("delete", "note", note.uid)}
                                  >
                                    <FaTrash className="w-5 h-5" />
                                  </button>
                                  <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="md:hidden space-y-4">
                      {moderationData.map((note) => (
                        <div
                          key={note.uid}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>UID:</strong> {note.uid}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>Title:</strong> {note.title || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>User:</strong> {note.user || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Flagged Date:</strong> {note.flaggedDate ? format(new Date(note.flaggedDate), "PPP") : "N/A"}
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <div className="relative group">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("view", "note", note.uid)}
                              >
                                <FaEye className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">View</span>
                            </div>
                            <div className="relative group">
                              <button
                                className="p-2 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("unflag", "note", note.uid)}
                              >
                                <FaFlag className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Unflag</span>
                            </div>
                            <div className="relative group">
                              <button
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all duration-200"
                                onClick={() => handleAction("delete", "note", note.uid)}
                              >
                                <FaTrash className="w-5 h-5" />
                              </button>
                              <span className="absolute bottom-full mb-2 hidden group-hover:block text-xs text-white bg-gray-800 dark:bg-gray-700 px-2 py-1 rounded-lg font-sans">Delete</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FaExclamationTriangle className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100 font-sans">No flagged content</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-sans">
                      No notes have been flagged for moderation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "logs":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">Activity Logs</h2>
                {logsData.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse hidden md:table">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                          {["ID", "Action", "User", "Timestamp", "Details"].map(header => (
                            <th
                              key={header}
                              className="py-4 px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider font-sans"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logsData.map((log, index) => (
                          <tr
                            key={log.id}
                            className={`${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                            } hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200`}
                          >
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{log.id}</td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{log.action || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">{log.user || "N/A"}</td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 font-sans">
                              {log.timestamp ? format(new Date(log.timestamp), "PPP p") : "N/A"}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[250px] font-sans" title={log.details}>
                              {log.details || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="md:hidden space-y-4">
                      {logsData.map((log) => (
                        <div
                          key={log.id}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <div className="space-y-2">
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>ID:</strong> {log.id}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Action:</strong> {log.action || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>User:</strong> {log.user || "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100">
                              <strong>Timestamp:</strong> {log.timestamp ? format(new Date(log.timestamp), "PPP p") : "N/A"}
                            </p>
                            <p className="text-sm font-sans text-gray-900 dark:text-gray-100 truncate">
                              <strong>Details:</strong> {log.details || "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FaClipboardList className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100 font-sans">No logs available</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-sans">
                      No activity logs have been recorded yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">Export & Reports</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 font-sans">User Export Report</h3>
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-sans"
                      onClick={() => {
                        const csv = [
                          "UID,Name,Email,Premium,Join Date,Notes Count,Status",
                          ...usersData.map(u =>
                            `${u.uid},${u.name || "N/A"},${u.email || "N/A"},${u.isPremium ? "Yes" : "No"},${u.date ? format(new Date(u.date), "PPP") : "N/A"},${u.notesCount || 0},${u.isActive ? "Active" : "Inactive"}`
                          ),
                        ].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "users_report.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download User CSV
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 font-sans">Note Export Report</h3>
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-sans"
                      onClick={() => {
                        const csv = [
                          "UID,Title,User,Tag,Date,Public,Deleted",
                          ...notesData.map(n =>
                            `${n.uid},${n.title || "N/A"},${n.user || "N/A"},${n.tag || "N/A"},${n.date ? format(new Date(n.date), "PPP") : "N/A"},${n.isPublic ? "Yes" : "No"},${n.isDeleted ? "Yes" : "No"}`
                          ),
                        ].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "notes_report.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Note CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "premium":
        return (
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 font-sans">Premium Controls</h2>
                <div className="space-y-6">
                  <p className="text-lg text-gray-800 dark:text-gray-200 font-sans">Total Premium Users: {premiumData.totalPremium}</p>
                  <p className="text-lg text-gray-800 dark:text-gray-200 font-sans">Free Usage Limits:</p>
                  <div className="space-y-4">
                    {["ai", "voice", "export"].map(key => (
                      <div key={key} className="flex items-center space-x-4">
                        <label className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize font-sans">{key}</label>
                        <input
                          type="number"
                          value={premiumData.freeUsageRemaining[key]}
                          onChange={e => {
                            const newPremiumData = {
                              ...premiumData,
                              freeUsageRemaining: {
                                ...premiumData.freeUsageRemaining,
                                [key]: parseInt(e.target.value) || 0,
                              },
                            };
                            setPremiumData(newPremiumData);
                          }}
                          className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-sans"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-sans"
                    onClick={async () => {
                      try {
                        await performAction("PUT", "premium", { freeUsageRemaining: premiumData.freeUsageRemaining });
                        alert("Premium settings updated successfully");
                      } catch (err) {
                        alert("Failed to update premium settings");
                      }
                    }}
                  >
                    Save Premium Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-6 text-gray-600 dark:text-gray-400 font-sans">No panel selected.</div>;
    }
  }, [activeTab, loading, error, overviewData, usersData, notesData, moderationData, logsData, reportsData, premiumData, handleAction]);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"} transition-colors duration-300 font-sans`}>
      <div className="flex">
        <aside
          className={`bg-gray-800 dark:bg-gray-950 text-white flex-shrink-0 overflow-y-auto transition-all duration-300 relative ${isSidebarCollapsed ? 'w-20' : ''}`}
          style={{ width: isSidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
        >
          <div className="sticky top-0 bg-gray-800 dark:bg-gray-950 z-10 p-6">
            <div className="flex items-center justify-between mb-8">
              <h1
                id="ApniNoteBook"
                className={`text-2xl font-bold tracking-tight flex items-center ${isSidebarCollapsed ? 'hidden' : ''}`}
              >
                <FaBookOpen className="text-blue-400 mr-2" aria-hidden="true" />
                <span>ApniNoteBook</span>
              </h1>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200 mx-5"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <FaBars size={20} />
              </button>
            </div>
            <ul className={`space-y-2 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
              {menuItems.map(item => (
                <li
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  onKeyDown={e => e.key === "Enter" && setActiveTab(item.key)}
                  className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeTab === item.key
                      ? "bg-blue-600 text-white shadow-lg border-l-4 border-blue-400"
                      : "hover:bg-gray-700 dark:hover:bg-gray-800 text-gray-200"
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  tabIndex={0}
                  role="button"
                >
                  <span>{item.icon}</span>
                  <span className={`font-medium ${isSidebarCollapsed ? 'hidden' : ''}`}>{item.label}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-6 flex items-center space-x-3 ${isSidebarCollapsed ? 'flex-col space-y-3' : ''}`}>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 transition-all duration-200"
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <FaMoon size={20} /> : <FaSun size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="p-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200"
                title="Logout"
              >
                <FaSignOutAlt size={20} />
              </button>
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div
              className="absolute top-0 right-0 w-2 h-full bg-gray-600 cursor-ew-resize"
              onMouseDown={handleMouseDown}
            />
          )}
        </aside>
        <main className="flex-1 p-6">
        
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300">
            {renderPanel()}
          </div>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative transform transition-all duration-300 animate-slide-up">
                <button
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FaTimes size={24} />
                </button>
                {modalContent}
              </div>
            </div>
          )}
        </main>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;