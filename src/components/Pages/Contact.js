import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import ContactiNotebook from "../../images/contact notebook.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";

const Contact = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1200, once: true, easing: "ease-in-out-back" });
  }, []);

  // Scroll Progress Indicator
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setStatus("🚫 Please fill in all fields.");
      return;
    }

    setIsSending(true);
    setStatus("");

    const API_BASE =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://apnibook-backend.onrender.com";

    try {
      const response = await fetch(`${API_BASE}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (response.ok) {
        setStatus("✅ Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("❌ Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("⚠️ An error occurred. Please check your connection.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans animated-gradient">
      <style>
        {`
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
            background: rgba(255, 255, 255, 0.4);
            animation: float 15s infinite ease-in-out;
            pointer-events: none;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-40vh) scale(0.8); }
          }
          .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(to right, #3b82f6, #9333ea);
            z-index: 1000;
            transform-origin: left;
          }
          .floating-cta {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
          }
          .nav-dot {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
          }
          .nav-dot span {
            display: block;
            width: 10px;
            height: 10px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transition: all 0.3s;
            position: relative;
            cursor: pointer;
          }
          .nav-dot span:hover::after {
            content: attr(data-section);
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            white-space: nowrap;
          }
          .nav-dot span.active {
            background: #FFD700;
            transform: scale(1.5);
          }
        `}
      </style>

      {/* Scroll Progress Bar */}
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollProgress / 100 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: scrollProgress / 100 }}
        transition={{ duration: 0.1 }}
      />

      {/* Particle Background */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 3}px`,
            height: `${Math.random() * 6 + 3}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 8 + 7}s`,
          }}
        />
      ))}

      {/* Floating CTA Button */}
      <motion.div
        className="floating-cta"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.button
          className="bg-yellow-300 text-gray-800 py-3 px-6 rounded-full shadow-lg hover:bg-yellow-400 transition font-semibold flex items-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/signup")}
        >
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          Join Now
        </motion.button>
      </motion.div>

      {/* Navigation Dots */}
      <div className="nav-dot">
        {[
          { id: "header", name: "Header" },
          { id: "form", name: "Contact Form" },
          { id: "faqs", name: "FAQs" },
          { id: "social", name: "Social Media" },
          { id: "cta", name: "Join Us" },
        ].map((section, index) => (
          <motion.span
            key={section.id}
            className={scrollProgress > index * 20 && scrollProgress < (index + 1) * 20 ? "active" : ""}
            data-section={section.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" })}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="container mx-auto text-center mb-12 px-4 sm:px-6 pt-10"
        id="header"
        data-aos="fade-down"
      >
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 80 }}
        >
          Contact <span className="text-yellow-400">Us</span>
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Reach out for queries, feedback, or collaboration opportunities.
        </motion.p>
        <motion.p
          className="text-sm sm:text-base italic mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          We’d love to hear from you!
        </motion.p>
      </div>

      {/* Form Section */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-12"
        id="form"
        data-aos="zoom-in"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
          {/* Contact Form */}
          <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} perspective={1000}>
            <motion.div
              className="bg-white bg-opacity-10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 hover:border-purple-400"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, rotateY: 5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.4)" }}
              data-aos="fade-right"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Contact Form</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-6">
                Send us your message, and we’ll get back to you promptly.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white/20 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={isSending}
                  className={`flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-lg transition-all duration-200 ${
                    isSending ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"
                  }`}
                  whileHover={{ scale: isSending ? 1 : 1.1 }}
                  whileTap={{ scale: isSending ? 1 : 0.9 }}
                >
                  {isSending && (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-800"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  )}
                  {isSending ? "Sending..." : "Send Message"}
                </motion.button>
                {status && (
                  <motion.p
                    className={`text-center mt-4 text-base sm:text-lg font-medium ${
                      status.includes("✅") ? "text-green-400" : "text-red-400"
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {status}
                  </motion.p>
                )}
              </form>
            </motion.div>
          </Tilt>

          {/* Image */}
          <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} perspective={1000}>
            <motion.div
              className="rounded-lg overflow-hidden shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.05, rotateY: -5 }}
              data-aos="fade-left"
            >
              <motion.img
                src={ContactiNotebook}
                alt="Contact Us"
                className="w-full rounded-lg"
                initial={{ y: 0 }}
                animate={{ y: [-10, 10] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=Contact")}
              />
            </motion.div>
          </Tilt>
        </div>
      </div>

      {/* FAQs */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-12 mt-12 sm:mt-16"
        id="faqs"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          FAQs
        </motion.h2>
        <div className="space-y-6">
          {[
            { question: "How can I contact support?", answer: "You can email us at apninotebook@gmail.com" },
            { question: "What is the response time?", answer: "We aim to respond within 24 hours." },
            { question: "Can I collaborate with you?", answer: "Yes, we’re open to collaborations! Send us an email." },
          ].map((faq, index) => (
            <Tilt
              key={index}
              tiltMaxAngleX={15}
              tiltMaxAngleY={15}
              perspective={1000}
              scale={1.03}
              className="w-full group"
            >
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg text-white p-4 sm:p-6 rounded-lg shadow-md border border-white/20 hover:border-purple-400 transition-all"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <h3 className="font-bold text-base sm:text-lg">{faq.question}</h3>
                <p className="text-sm sm:text-base">{faq.answer}</p>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn More
                </div>
              </motion.div>
            </Tilt>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div
        className="container mx-auto text-center mt-12 sm:mt-16 px-4 sm:px-6"
        id="social"
        data-aos="zoom-in-up"
      >
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Follow Us on Social Media
        </motion.h2>
        <motion.p
          className="text-base sm:text-lg mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Stay connected and get the latest updates.
        </motion.p>
        <div className="flex justify-center space-x-6 sm:space-x-8">
          {[
            { icon: "fab fa-facebook-f", color: "text-blue-600", link: "#", name: "Facebook" },
            { icon: "fab fa-twitter", color: "text-blue-400", link: "#", name: "Twitter" },
            { icon: "fab fa-instagram", color: "text-pink-500", link: "#", name: "Instagram" },
            { icon: "fab fa-linkedin-in", color: "text-gray-800", link: "#", name: "LinkedIn" },
          ].map((social, index) => (
            <Tilt
              key={index}
              tiltMaxAngleX={20}
              tiltMaxAngleY={20}
              perspective={800}
              scale={1.2}
              className="group"
            >
              <motion.a
                href={social.link}
                className={`${social.color} text-2xl sm:text-3xl relative`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.25, rotate: 5 }}
              >
                <i className={social.icon}></i>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {social.name}
                </span>
              </motion.a>
            </Tilt>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="container mx-auto text-center mt-12 sm:mt-16 pb-16 px-4 sm:px-6"
        id="cta"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Join Us on This Journey!
        </motion.h2>
        <motion.button
          className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-lg hover:bg-yellow-500"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/signup")}
        >
          Create an Account
        </motion.button>
      </div>
    </div>
  );
};

export default Contact;