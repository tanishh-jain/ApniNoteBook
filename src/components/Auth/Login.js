import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner, FaKey } from "react-icons/fa";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ showAlert }) => {
  const host =
    process.env.NODE_ENV === "production"
      ? "https://apnibook-backend.onrender.com"
      : "http://localhost:5000";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${host}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (json.success) {
        localStorage.setItem("token", json.authtoken);
        localStorage.setItem("nanoId", json.nanoId);
        localStorage.setItem("isPremium", json.isPremium);
        showAlert("Logged In Successfully", "success");
        navigate(json.admin ? "/admin/dashboard" : `/${json.nanoId}/dashboard`);
      } else {
        showAlert("Invalid credentials", "danger");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error during login:", error);
      showAlert("An error occurred. Please try again later.", "danger");
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const response = await fetch(`${host}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const json = await response.json();
      if (json.success) {
        localStorage.setItem("token", json.authtoken);
        localStorage.setItem("nanoId", json.nanoId);
        localStorage.setItem("isPremium", json.isPremium);
        showAlert("Logged In Successfully with Google", "success");
        navigate(json.admin ? "/admin/dashboard" : `/${json.nanoId}/dashboard`);
      } else {
        showAlert(json.error || "Authentication failed", "danger");
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    }
  };

  const handleGoogleError = () => {
    showAlert("Google Sign-In was unsuccessful. Please try again.", "danger");
  };

  const handleSendOtp = async () => {
    if (!forgotEmail) {
      showAlert("Please enter your email", "danger");
      return;
    }
    setForgotLoading(true);
    try {
      const response = await fetch(`${host}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await response.json();
      if (json.success) {
        setResetToken(json.resetToken);
        setCurrentStep('otp');
        showAlert("OTP sent to your email", "success");
      } else {
        showAlert(json.error || "Failed to send OTP", "danger");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      showAlert("Please enter the OTP", "danger");
      return;
    }
    setForgotLoading(true);
    try {
      const response = await fetch(`${host}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, resetToken }),
      });
      const json = await response.json();
      if (json.success) {
        setCurrentStep('password');
        showAlert("OTP verified successfully", "success");
      } else {
        showAlert(json.error || "Invalid OTP", "danger");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("Please enter both password fields", "danger");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Passwords do not match", "danger");
      return;
    }
    setForgotLoading(true);
    try {
      const response = await fetch(`${host}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, resetToken }),
      });
      const json = await response.json();
      if (json.success) {
        setShowModal(false);
        showAlert("Password reset successfully", "success");
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        setCurrentStep('email');
      } else {
        showAlert(json.error || "Failed to reset password", "danger");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentStep('email');
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4 sm:p-6">
      <motion.div
className="w-full max-w-[500px] bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 p-8 text-center text-white">
          <motion.h2
            className="text-4xl font-extrabold tracking-tight"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="text-yellow-300">ApniNoteBook</span>
          </motion.h2>
          <motion.p
            className="text-lg mt-2 opacity-90 font-medium"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Sign in to your account
          </motion.p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Email */}
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type="email"
                id="email"
                name="email"
                placeholder="Email address"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <motion.span
                className="text-blue-500 hover:text-blue-600 text-sm font-medium cursor-pointer"
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.05, color: '#2563eb' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Forgot Password?
              </motion.span>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-lg font-semibold text-white
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50"}
                transition-all duration-300 shadow-lg`}
              whileHover={loading ? {} : { scale: 1.05, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
              whileTap={loading ? {} : { scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <>
                  <motion.span
                    className="mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <FaSpinner />
                  </motion.span>
                  Logging in…
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Sign In
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Google Login */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-gray-500 text-sm mb-4 font-medium">Or continue with</p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
                theme="filled_blue"
                shape="pill"
                text="signin_with"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 p-5 text-center text-white">
          <motion.p
            className="text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-yellow-300 font-semibold hover:text-yellow-200 transition duration-200"
            >
              Sign Up
            </Link>
          </motion.p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 w-full max-w-sm border border-white/20"
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-center text-gray-800">Reset Password</h3>
              <div className="flex justify-center mt-4 space-x-4">
                {['email', 'otp', 'password'].map((step, index) => (
                  <motion.div
                    key={step}
                    className={`w-10 h-2 rounded-full ${
                      currentStep === step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'
                    }`}
                    animate={{ scale: currentStep === step ? 1.2 : 1 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>

            {currentStep === 'email' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                  Enter your email to receive an OTP
                </p>
                <div className="relative group mb-5">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
                  <motion.input
                    type="email"
                    placeholder="Email address"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    className="px-5 py-2 bg-gray-200/80 text-gray-700 rounded-xl hover:bg-gray-300 transition duration-200 shadow-sm"
                    onClick={closeModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center shadow-md"
                    onClick={handleSendOtp}
                    disabled={forgotLoading}
                    whileHover={forgotLoading ? {} : { scale: 1.05, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
                    whileTap={forgotLoading ? {} : { scale: 0.95 }}
                  >
                    {forgotLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 'otp' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                  Enter the OTP sent to your email
                </p>
                <div className="relative group mb-5">
                  <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
                  <motion.input
                    type="text"
                    placeholder="Enter OTP"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm text-gray-600 font-medium">Didn't receive OTP?</span>
                  <motion.button
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    onClick={handleSendOtp}
                    disabled={forgotLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Resend OTP
                  </motion.button>
                </div>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    className="px-5 py-2 bg-gray-200/80 text-gray-700 rounded-xl hover:bg-gray-300 transition duration-200 shadow-sm"
                    onClick={closeModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center shadow-md"
                    onClick={handleVerifyOtp}
                    disabled={forgotLoading}
                    whileHover={forgotLoading ? {} : { scale: 1.05, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
                    whileTap={forgotLoading ? {} : { scale: 0.95 }}
                  >
                    {forgotLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {currentStep === 'password' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                  Enter your new password
                </p>
                <div className="relative group mb-4">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
                  <motion.input
                    type="password"
                    placeholder="New Password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="relative group mb-5">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
                  <motion.input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    className="px-5 py-2 bg-gray-200/80 text-gray-700 rounded-xl hover:bg-gray-300 transition duration-200 shadow-sm"
                    onClick={closeModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 flex items-center shadow-md"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
                    whileHover={forgotLoading ? {} : { scale: 1.05, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
                    whileTap={forgotLoading ? {} : { scale: 0.95 }}
                  >
                    {forgotLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;