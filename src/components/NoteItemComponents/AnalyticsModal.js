import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import { FaTimes } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsModal = ({ isOpen, onClose, analyticsData, loading, getTimeAgo }) => {
  if (!isOpen) return null;

  // Prepare data for the chart
  const chartData = {
    labels: analyticsData.map((data) => data.title || 'Untitled Note'),
    datasets: [
      {
        label: 'Likes',
        data: analyticsData.map((data) => data.likes || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.6)', // Purple
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Comments',
        data: analyticsData.map((data) => data.comments?.length || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: 'Arial, sans-serif',
          },
          color: '#1F2937', // Gray-800
        },
      },
      title: {
        display: true,
        text: 'Note Engagement Analytics',
        font: {
          size: 16,
          weight: 'bold',
          family: 'Arial, sans-serif',
        },
        color: '#1F2937',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#1F2937',
        },
        ticks: {
          stepSize: 1,
          color: '#1F2937',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Notes',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#1F2937',
        },
        ticks: {
          color: '#1F2937',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false,
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Analytics modal"
    >
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold tracking-wider uppercase text-purple-200 truncate">
            Analytics for Selected Notes
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="text-white hover:text-red-400 transition-transform"
            aria-label="Close analytics modal"
          >
            <FaTimes size={16} />
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-gray-800 rounded-b-2xl">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
              <CircularProgress size={40} />
              <span className="ml-4 text-white text-base sm:text-lg font-medium">Loading...</span>
            </div>
          )}
          {/* Chart Section */}
          <div className="mb-6">
            <div className="h-64 sm:h-80 md:h-96 bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          {/* Analytics Details */}
          <div className="space-y-6">
            {analyticsData.map((data, index) => (
              <motion.div
                key={data.noteId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 truncate">
                  {data.title || 'Untitled Note'}
                </h3>
                <div className="text-gray-700 text-sm space-y-4">
                  {/* Likes Section */}
                  <div>
                    <p className="font-medium text-gray-800 text-base">
                      <strong>Likes:</strong> {data.likes || 0}
                    </p>
                    {data.likedBy?.length > 0 ? (
                      <div className="mt-3">
                        <p className="font-semibold text-gray-800">Liked By:</p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {data.likedBy.map((user) => (
                            <motion.div
                              key={user._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm border border-gray-100"
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0"
                              >
                                {user.profilePicture && user.profilePicture.startsWith('data:image/') ? (
                                  <img
                                    src={user.profilePicture}
                                    alt={`${user.name}'s profile`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://via.placeholder.com/40?text=${user.name.charAt(0).toUpperCase()}`;
                                    }}
                                  />
                                ) : (
                                  <span className="text-purple-600 font-medium text-base sm:text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                  {user.name}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic mt-2">No likes yet.</p>
                    )}
                  </div>
                  {/* Comments Section */}
                  <div>
                    <p className="font-medium text-gray-800 text-base">
                      <strong>Comments:</strong> {data.comments?.length || 0}
                    </p>
                    {data.comments?.length > 0 ? (
                      <div className="mt-3">
                        <p className="font-semibold text-gray-800">Comments:</p>
                        <div className="mt-2 space-y-3">
                          {data.comments.map((comment, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0"
                              >
                                {comment.user.profilePicture && comment.user.profilePicture.startsWith('data:image/') ? (
                                  <img
                                    src={comment.user.profilePicture}
                                    alt={`${comment.user.name}'s profile`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://via.placeholder.com/40?text=${comment.user.name.charAt(0).toUpperCase()}`;
                                    }}
                                  />
                                ) : (
                                  <span className="text-purple-600 font-medium text-base sm:text-lg">
                                    {comment.user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-gray-500">{getTimeAgo(comment.date)}</span>
                                </div>
                                <p className="text-gray-700 text-sm mt-1 break-words">{comment.text}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic mt-2">No comments yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-end mt-4 sm:mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={onClose}
              className="px-4 py-2 sm:px-6 sm:py-2 text-sm font-medium text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-500 transition-all duration-300"
              aria-label="Close analytics modal"
            >
              Close
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsModal;