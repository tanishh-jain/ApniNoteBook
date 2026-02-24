import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';

const Signup = ({ showAlert }) => {
  const host =
    process.env.NODE_ENV === "production"
      ? "https://apnibook-backend.onrender.com"
      : "http://localhost:5000";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cpassword: "",
    remember: false,
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  // Basic inline validation
  const validateField = (field, value) => {
    let msg = "";
    if (!value.trim()) msg = `${field[0].toUpperCase() + field.slice(1)} is required.`;
    else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      msg = "Invalid email address.";
    else if (field === "password" && value.length < 6)
      msg = "Password must be at least 6 characters.";
    else if (field === "cpassword" && value !== formData.password)
      msg = "Passwords do not match.";
    setErrors((e) => ({ ...e, [field]: msg }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((d) => ({ ...d, [name]: val }));
    if (["name", "email", "password", "cpassword"].includes(name)) {
      validateField(name, val);
      if (name === "password" && formData.cpassword) {
        validateField("cpassword", formData.cpassword);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Final validation pass
    Object.entries(formData)
      .filter(([k, v]) => ["name", "email", "password", "cpassword"].includes(k) && typeof v === "string")
      .forEach(([k, v]) => validateField(k, v));
    if (
      !formData.terms ||
      Object.values(formData).slice(0, 4).some((v) => !v) ||
      Object.values(errors).some((m) => m)
    ) {
      showAlert("Please fix errors and accept terms.", "danger");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${host}/api/auth/signup-with-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSent(true);
showAlert("OTP sent to your email. Please verify. If you don't see it, check your spam or junk folder.", "success");
      } else {
        showAlert(json.error || "Invalid Details", "danger");
      }
    } catch {
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${host}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem("token", json.authtoken);
        if (json.nanoId) localStorage.setItem("nanoId", json.nanoId);
        showAlert("Account Successfully Created", "success");
        navigate(json.nanoId ? `/${json.nanoId}/dashboard` : "/dashboard");
      } else {
        showAlert(json.error || "Invalid OTP", "danger");
      }
    } catch {
      showAlert("An error occurred. Please try again later.", "danger");
    } finally {
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
        showAlert("Account Created Successfully with Google", "success");
        navigate(json.nanoId ? `/${json.nanoId}/dashboard` : "/dashboard");
      } else {
        showAlert(json.error || "Authentication failed", "danger");
      }
    } catch (error) {
      console.error("Error during Google signup:", error);
      showAlert("An error occurred. Please try again later.", "danger");
    }
  };

  const handleGoogleError = () => {
    showAlert("Google Sign-Up was unsuccessful. Please try again.", "danger");
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
            Join <span className="text-yellow-300">ApniNoteBook</span>
          </motion.h2>
          <motion.p
            className="text-lg mt-2 opacity-90 font-medium"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Create your account to start noting
          </motion.p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Name */}
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type="text"
                id="name"
                name="name"
                placeholder="Your Name"
                className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white/50 focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm ${
                  errors.name
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-200/50 focus:ring-blue-400 focus:border-transparent"
                }`}
                value={formData.name}
                onChange={handleChange}
                disabled={otpSent}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              {errors.name && (
                <motion.p
                  className="text-sm text-red-500 mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Email */}
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type="email"
                id="email"
                name="email"
                placeholder="Email address"
                className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white/50 focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm ${
                  errors.email
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-200/50 focus:ring-blue-400 focus:border-transparent"
                }`}
                value={formData.email}
                onChange={handleChange}
                disabled={otpSent}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              {errors.email && (
                <motion.p
                  className="text-sm text-red-500 mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type={showPwd ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                className={`w-full pl-12 pr-12 py-3 rounded-xl border bg-white/50 focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm ${
                  errors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-200/50 focus:ring-blue-400 focus:border-transparent"
                }`}
                value={formData.password}
                onChange={handleChange}
                disabled={otpSent}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors duration-200 disabled:opacity-50"
                disabled={otpSent}
              
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </motion.button>
              {errors.password && (
                <motion.p
                  className="text-sm text-red-500 mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
              <motion.input
                type={showCPwd ? "text" : "password"}
                id="cpassword"
                name="cpassword"
                placeholder="Confirm Password"
                className={`w-full pl-12 pr-12 py-3 rounded-xl border bg-white/50 focus:outline-none focus:ring-2 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm ${
                  errors.cpassword
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-200/50 focus:ring-blue-400 focus:border-transparent"
                }`}
                value={formData.cpassword}
                onChange={handleChange}
                disabled={otpSent}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              <motion.button
                type="button"
                onClick={() => setShowCPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors duration-200 disabled:opacity-50"
                disabled={otpSent}
               
               
              >
                {showCPwd ? <FaEyeSlash /> : <FaEye />}
              </motion.button>
              {errors.cpassword && (
                <motion.p
                  className="text-sm text-red-500 mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.cpassword}
                </motion.p>
              )}
            </div>

            {/* Remember & Terms */}
            <motion.div
              className="flex items-center justify-between text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  disabled={otpSent}
                />
                <span className="ml-2 text-gray-800 font-medium">Remember me</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  disabled={otpSent}
                />
                <span className="ml-2 text-gray-800 font-medium">
                  I agree to{" "}
                  <Link to="/terms" className="text-blue-500 hover:text-blue-600 transition duration-200">
                    Terms & Conditions
                  </Link>
                </span>
              </label>
            </motion.div>

            {/* Submit */}
            {!otpSent && (
              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50"
                }`}
                whileHover={loading ? {} : { scale: 1.05, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)" }}
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
                    Sending OTP…
                  </>
                ) : (
                  "Sign Up"
                )}
              </motion.button>
            )}

            {/* OTP Input */}
            {otpSent && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl group-hover:text-blue-500 transition-colors duration-300" />
                  <motion.input
                    type="text"
                    id="otp"
                    name="otp"
                    placeholder="Enter OTP"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={handleOtpSubmit}
                  disabled={loading}
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 shadow-lg ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300/50"
                  }`}
                  whileHover={loading ? {} : { scale: 1.05, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)" }}
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
                      Verifying OTP…
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full text-center text-sm text-blue-500 hover:text-blue-600 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Resend OTP
                </motion.button>
              </motion.div>
            )}
          </motion.form>

          {/* Google Signup */}
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
                text="signup_with"
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
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-yellow-300 font-semibold hover:text-yellow-200 transition duration-200"
            >
              Login
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;