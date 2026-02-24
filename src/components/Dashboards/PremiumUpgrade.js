import React, { useEffect, useState, useRef, useCallback, memo, Suspense } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { FaCrown, FaRocket, FaLock, FaInfinity, FaGem, FaUserCircle, FaStar, FaBook } from "react-icons/fa";
import Confetti from "react-confetti";
import PropTypes from "prop-types";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-xl">
          Something went wrong: {this.state.error?.message || "Unknown error"}
          <button
            onClick={() => window.location.reload()}
            className="underline hover:text-red-300 ml-2"
            aria-label="Retry loading page"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

// Reusable Components
const FeatureCard = memo(({ icon: Icon, title, desc }) => (
  <motion.div
    className="p-6 bg-gray-900/50 rounded-xl shadow-lg hover:bg-purple-900/30 transition-all duration-300"
    whileHover={{ scale: 1.1, rotate: 2, boxShadow: "0 0 15px rgba(147, 51, 234, 0.5)" }}
    whileTap={{ scale: 0.95 }}
    role="article"
    tabIndex={0}
  >
    <Icon className="text-4xl text-purple-400 mb-4 animate-pulse" style={{ transform: "translateZ(20px)" }} />
    <h4 className="text-lg font-bold text-white">{title}</h4>
    <p className="text-gray-300">{desc}</p>
  </motion.div>
));

FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
};

const TestimonialCard = memo(({ name, role, quote, rating }) => (
  <motion.div
    className="p-6 bg-gray-900/50 rounded-xl shadow-lg hover:bg-purple-900/30 transition-all duration-300"
    whileHover={{ scale: 1.05, rotate: -1, boxShadow: "0 0 15px rgba(147, 51, 234, 0.5)" }}
    whileTap={{ scale: 0.95 }}
    role="article"
    tabIndex={0}
  >
    <div className="flex items-center mb-4">
      <FaUserCircle className="text-4xl text-purple-400 mr-4" style={{ transform: "translateZ(15px)" }} />
      <div>
        <p className="font-bold text-white">{name}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
    <p className="text-gray-300 italic mb-4">"{quote}"</p>
    <div className="flex" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} className={i < rating ? "text-yellow-400" : "text-gray-500"} />
      ))}
    </div>
  </motion.div>
));

TestimonialCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  quote: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
};

const FAQItem = memo(({ question, answer, index }) => (
  <motion.div
    className="p-4 bg-gray-900/50 rounded-xl shadow-lg hover:bg-purple-900/30 transition-all duration-300"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
    role="region"
    aria-labelledby={`faq-question-${index}`}
    tabIndex={0}
  >
    <h4 id={`faq-question-${index}`} className="text-lg font-bold text-purple-300 flex items-center">
      <FaBook className="mr-2 text-purple-400 animate-pulse" />
      {question}
    </h4>
    <p className="text-gray-300 mt-2">{answer}</p>
  </motion.div>
));

FAQItem.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

const PremiumUpgrade = () => {
  const { nanoId } = useParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [error, setError] = useState("");
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef(null);

  const host = process.env.NODE_ENV === "production"
    ? "https://apnibook-backend.onrender.com"
    : "http://localhost:5000";

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.post(
        `${host}/api/auth/getuser`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );
      setUser(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching user info:", err);
      setError("Unable to load user info. Please try again later.");
    }
  }, [host]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => console.log("Razorpay script loaded");
        script.onerror = () => setError("Failed to load payment gateway. Please refresh the page.");
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
      } catch (err) {
        setError("Failed to initialize payment gateway. Please try again.");
      }
    };
    loadRazorpay();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

 const handleUpgrade = useCallback(async () => {
  setLoading(true);
  setError(""); // Clear previous errors
  try {
    // Ensure Razorpay script is loaded
    if (!window.Razorpay) {
      setError("Payment gateway not loaded. Please try again later.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    // Fetch order from backend
    const orderResponse = await axios.post(
      `${host}/api/payment/create-order`,
      { amount: 99900 },
      {
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      }
    ).catch((err) => {
      // Extract detailed error from backend response
      const errorMessage = err.response?.data?.error || err.message || "Failed to initiate payment";
      throw new Error(errorMessage);
    });

    const { orderId, razorpayKey } = orderResponse.data;

    const options = {
      key: razorpayKey,
      amount: 99900,
      currency: "INR",
      name: "ApniNoteBook",
      description: "Premium Upgrade",
      order_id: orderId,
      handler: async function (response) {
        try {
          const verifyResponse = await axios.post(
            `${host}/api/payment/verify`,
            {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "auth-token": token,
              },
            }
          ).catch((err) => {
            const errorMessage = err.response?.data?.error || err.message || "Payment verification failed";
            throw new Error(errorMessage);
          });

          if (verifyResponse.data.success) {
            setUpgradeSuccess(true);
            localStorage.setItem("isPremium", "true");
            await fetchUser(); // Refresh user data
            setError("");
          } else {
            setError("Payment verification failed. Please contact support.");
          }
        } catch (err) {
          console.error("Payment verification error:", err);
          setError(err.message || "Payment verification failed. Please try again or contact support.");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      theme: {
        color: "#9333EA",
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setError("Payment was cancelled.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      setError(`Payment failed: ${response.error.description || "Unknown error"}`);
      setLoading(false);
    });
    rzp.open();
  } catch (err) {
    console.error("Error initiating payment:", err);
    setError(err.message || "Unable to process payment. Please check your connection or try again.");
    setLoading(false);
  }
}, [host, user, fetchUser]);

  const faqs = [
    {
      question: "What is included in the Premium Plan?",
      answer: "Unlimited AI enhancements, all export formats, 24/7 priority support, ad-free experience, enhanced security, and unlimited storage.",
    },
    {
      question: "Is the payment one-time or recurring?",
      answer: "One-time payment for lifetime access, no recurring fees.",
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "7-day money-back guarantee. Contact support within 7 days.",
    },
    {
      question: "How do I contact support?",
      answer: "Premium users get 24/7 priority support via support@apninotebook.com or live chat.",
    },
  ];

  const testimonials = [
    {
      name: "Priya S.",
      role: "Premium User",
      quote: "The AI tools and ad-free experience are game-changers for note-taking!",
      rating: 5,
    },
    {
      name: "Rahul M.",
      role: "Freelancer",
      quote: "Unlimited storage and enhanced security give me peace of mind.",
      rating: 5,
    },
    {
      name: "Anita K.",
      role: "Student",
      quote: "AI enhancements make organizing study notes effortless!",
      rating: 4,
    },
  ];

  const features = [
    { icon: FaGem, title: "Lifetime Access", desc: "One-time payment, forever benefits." },
    { icon: FaRocket, title: "Advanced AI", desc: "Supercharge your notes with AI." },
    { icon: FaLock, title: "Top Security", desc: "Military-grade encryption." },
    { icon: FaInfinity, title: "Unlimited Storage", desc: "No limits on your creativity." },
  ];

  const planComparison = [
    { feature: "AI Enhancements", free: "5/month", premium: "Unlimited" },
    { feature: "Export Options", free: "PDF only", premium: "All formats" },
    { feature: "Support", free: "Email", premium: "24/7 Priority" },
    { feature: "Ads", free: "Yes", premium: "None" },
    { feature: "Security", free: "Basic", premium: "Enhanced" },
    { feature: "Storage", free: "1GB", premium: "Unlimited" },
  ];

  // 3D Tilt Effect
  const mouseX = useSpring(0, { stiffness: 100, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 100, damping: 20 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleKeyDown = useCallback((e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
        {/* Confetti Background */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={50}
          colors={["#9333EA", "#FBBF24", "#3B82F6"]}
          opacity={0.5}
          recycle={true}
          gravity={0.05}
          wind={0.01}
          className="absolute inset-0 z-0"
          aria-hidden="true"
        />

        <motion.div
          ref={containerRef}
          className="relative max-w-7xl mx-auto p-4 sm:p-6 md:p-8 z-10"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: 1000 }}
          role="main"
        >
          <motion.div
            className="bg-gradient-to-r from-blue-800/80 via-purple-800/80 to-indigo-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 backdrop-blur-md"
            style={{ rotateX, rotateY }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            {/* Hero Section */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-center text-purple-300 mb-4 tracking-wide"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <FaCrown className="inline-block mr-2 text-yellow-300 animate-pulse" aria-hidden="true" />
              Upgrade to Premium
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-center text-gray-200 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Transform your note-taking with exclusive, futuristic features
            </motion.p>

            {nanoId && (
              <motion.p
                className="text-center text-gray-300 mb-6 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                User ID: <span className="font-semibold">{nanoId}</span>
              </motion.p>
            )}

            {error && (
              <motion.div
                className="text-center text-red-400 font-semibold mb-6 p-4 bg-red-900/50 rounded-xl shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                role="alert"
              >
                {error}{" "}
                <button
                  onClick={fetchUser}
                  onKeyDown={(e) => handleKeyDown(e, fetchUser)}
                  className="underline hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Retry loading user info"
                >
                  Retry
                </button>
              </motion.div>
            )}

            <Suspense fallback={<div className="text-center text-gray-300">Loading...</div>}>
              {user ? (
                <>
                  {user.isPremium ? (
                    <motion.div
                      className="text-center text-green-400 font-semibold flex items-center justify-center space-x-2 p-6 bg-green-900/50 rounded-xl shadow-lg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      role="alert"
                    >
                      <FaCrown className="text-3xl animate-bounce" aria-hidden="true" />
                      <span>
                        You are a <span className="font-bold">Premium User</span> 🚀
                      </span>
                    </motion.div>
                  ) : (
                    <>
                      {/* Plan Comparison Section */}
                      <motion.section
                        className="mb-12"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        aria-labelledby="plan-comparison"
                      >
                        <h3
                          id="plan-comparison"
                          className="text-2xl sm:text-3xl font-semibold text-center text-white mb-6"
                        >
                          Choose Your Plan
                        </h3>
                        <div className="overflow-x-auto rounded-xl shadow-2xl">
                          <table className="w-full text-left bg-gray-900/50 backdrop-blur-md">
                            <thead>
                              <tr className="bg-purple-900/70 text-purple-200">
                                <th className="p-4 text-lg font-bold">Feature</th>
                                <th className="p-4 text-lg font-bold text-center">Free</th>
                                <th className="p-4 text-lg font-bold text-center">Premium</th>
                              </tr>
                            </thead>
                            <tbody>
                              {planComparison.map((item, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-purple-500/30 hover:bg-purple-900/20 transition-colors"
                                >
                                  <td className="p-4">{item.feature}</td>
                                  <td className="p-4 text-center text-gray-300">{item.free}</td>
                                  <td className="p-4 text-center text-yellow-300">{item.premium}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <motion.button
                          onClick={handleUpgrade}
                          onKeyDown={(e) => handleKeyDown(e, handleUpgrade)}
                          disabled={loading}
                          className="mt-6 mx-auto flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.7)] disabled:opacity-50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Upgrade to Premium Plan"
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin h-5 w-5 mr-2 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                />
                              </svg>
                              Upgrading...
                            </span>
                          ) : (
                            <>
                              <FaCrown className="mr-2 animate-pulse" aria-hidden="true" />
                              Upgrade for ₹999 (One-Time)
                            </>
                          )}
                        </motion.button>
                      </motion.section>

                      {/* Why Go Premium Section */}
                      <motion.section
                        className="mb-12"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        aria-labelledby="why-premium"
                      >
                        <h3
                          id="why-premium"
                          className="text-2xl sm:text-3xl font-semibold text-center text-white mb-6"
                        >
                          Why Choose Premium?
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {features.map((item, index) => (
                            <FeatureCard key={index} icon={item.icon} title={item.title} desc={item.desc} />
                          ))}
                        </div>
                      </motion.section>

                      {/* Testimonial Section */}
                      <motion.section
                        className="mb-12"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        aria-labelledby="testimonials"
                      >
                        <h3
                          id="testimonials"
                          className="text-2xl sm:text-3xl font-semibold text-center text-white mb-6"
                        >
                          Hear From Our Users
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {testimonials.map((testimonial, index) => (
                            <TestimonialCard
                              key={index}
                              name={testimonial.name}
                              role={testimonial.role}
                              quote={testimonial.quote}
                              rating={testimonial.rating}
                            />
                          ))}
                        </div>
                      </motion.section>

                      {/* FAQ Section */}
                      <motion.section
                        className="mb-12"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        aria-labelledby="faqs"
                      >
                        <h3 id="faqs" className="text-2xl sm:text-3xl font-semibold text-center text-white mb-6">
                          Frequently Asked Questions
                        </h3>
                        <div className="space-y-4">
                          {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
                          ))}
                        </div>
                      </motion.section>

                      {/* Success Message */}
                      {upgradeSuccess && (
                        <motion.div
                          className="text-center text-green-400 font-semibold p-6 bg-green-900/50 rounded-xl shadow-lg"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1, duration: 0.5 }}
                          role="alert"
                        >
                          Upgrade Successful! Unleash Your Premium Features Now 🚀
                        </motion.div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <motion.div
                  className="text-center text-gray-300 mt-10 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  role="status"
                >
                  <svg
                    className="animate-spin h-6 w-6 mr-2 text-purple-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading user info...
                </motion.div>
              )}
            </Suspense>
          </motion.div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default PremiumUpgrade;
