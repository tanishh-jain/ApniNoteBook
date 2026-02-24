// components/Help.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import ContactiNotebook from "../../images/help.gif";
const Help = ({ showAlert }) => {
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Predefined FAQ questions and answers for the chatbot
  const faqs = [
    {
      question: "How do I create a new note?",
      answer: "To create a new note, go to your Dashboard and click the 'Add Note' button. Fill in the title and content, then save it!",
    },
    {
      question: "How can I share my notes?",
      answer: "In the Dashboard, select the note you want to share, click 'Publish', and copy the generated link to share with others.",
    },
    {
      question: "What are the benefits of a Premium account?",
      answer: "A Premium account offers unlimited note storage, advanced editing features, and priority support. Upgrade from your Profile page!",
    },
    {
      question: "How do I contact support?",
      answer: "Visit the Contact page from the navigation menu or click the 'Contact Support' link below to send us a message.",
    },
    {
      question: "How do I reset my password?",
      answer: "On the Login page, click 'Forgot Password' and follow the instructions to reset your password via email.",
    },
  ];

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({ duration: 1200, once: true, easing: "ease-in-out-back" });
  }, []);

  // Scroll Progress Indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle chatbot question selection
  const handleQuestionClick = (faq) => {
    setSelectedQuestion(faq.question);
    setChatMessages((prev) => [
      ...prev,
      { type: "user", text: faq.question },
      { type: "bot", text: faq.answer },
    ]);
    // Scroll to the bottom of the chat container
    setTimeout(() => {
      const chatContainer = document.getElementById("chat-container");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  };

  // Handle custom question submission
  const handleCustomQuestion = () => {
    showAlert("For custom questions, please visit the Contact page!", "info");
    navigate("/contact");
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
          .chat-container {
            max-height: 400px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #9333ea #1f2937;
          }
          .chat-container::-webkit-scrollbar {
            width: 8px;
          }
          .chat-container::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 10px;
          }
          .chat-container::-webkit-scrollbar-thumb {
            background: #9333ea;
            border-radius: 10px;
          }
          .chat-message {
            max-width: 80%;
            margin-bottom: 10px;
            padding: 10px 15px;
            border-radius: 10px;
          }
          .chat-message.user {
            background: #3b82f6;
            margin-left: auto;
            border-bottom-right-radius: 0;
          }
          .chat-message.bot {
            background: #9333ea;
            margin-right: auto;
            border-bottom-left-radius: 0;
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
          { id: "chatbot", name: "Chatbot" },
          { id: "quick-links", name: "Quick Links" },
          { id: "faqs", name: "FAQs" },
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
          Help & <span className="text-yellow-400">Support</span>
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Find answers to your questions or get in touch with our support team.
        </motion.p>
        <motion.p
          className="text-sm sm:text-base italic mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          We’re here to help you succeed with ApniNoteBook!
        </motion.p>
      </div>

      {/* Chatbot Section */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-12"
        id="chatbot"
        data-aos="zoom-in"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
          {/* Chatbot Interface */}
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
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Ask Our Chatbot</h2>
              <p className="text-sm sm:text-base leading-relaxed mb-6">
                Select a question below or contact us for more specific queries.
              </p>
              <div className="chat-container" id="chat-container">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`chat-message ${msg.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {faqs.map((faq, index) => (
                  <motion.button
                    key={index}
                    className="w-full text-left px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white hover:bg-opacity-30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuestionClick(faq)}
                  >
                    <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                    {faq.question}
                  </motion.button>
                ))}
                <motion.button
                  className="w-full px-4 py-2 bg-yellow-400 text-gray-800 font-semibold rounded-lg hover:bg-yellow-500 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCustomQuestion}
                >
                  Ask a Custom Question
                </motion.button>
              </div>
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
                alt="Help & Support"
                className="w-full rounded-lg"
                initial={{ y: 0 }}
                animate={{ y: [-10, 10] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=Help")}
              />
            </motion.div>
          </Tilt>
        </div>
      </div>

      {/* Quick Links Section */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-12 mt-12 sm:mt-16"
        id="quick-links"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Quick Links
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { title: "Contact Support", link: "/contact", desc: "Reach out to our support team for assistance." },
            { title: "Documentation", link: "https://docs.example.com", external: true, desc: "Read our detailed guides and tutorials." },
            { title: "FAQs", action: () => showAlert("FAQ section is above!", "info"), desc: "Find answers to common questions." },
          ].map((link, index) => (
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
                {link.link ? (
                  <a
                    href={link.link}
                    target={link.external ? "_blank" : "_self"}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="font-bold text-base sm:text-lg text-yellow-400 hover:underline"
                  >
                    {link.title}
                  </a>
                ) : (
                  <button
                    onClick={link.action}
                    className="font-bold text-base sm:text-lg text-yellow-400 hover:underline"
                  >
                    {link.title}
                  </button>
                )}
                <p className="text-sm sm:text-base">{link.desc}</p>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore
                </div>
              </motion.div>
            </Tilt>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
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
          Frequently Asked Questions
        </motion.h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
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

      {/* CTA Section */}
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
          Need More Help?
        </motion.h2>
        <motion.button
          className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-400 text-gray-800 font-semibold rounded-lg shadow-lg hover:bg-yellow-500"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/contact")}
        >
          Contact Support
        </motion.button>
      </div>
    </div>
  );
};

export default Help;