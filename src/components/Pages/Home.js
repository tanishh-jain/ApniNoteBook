import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import { ReactTyped as Typed } from "react-typed";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import Slider from "react-slick";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Student from "../../images/Student.png";
import Professional from "../../images/Professional.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudUploadAlt,
  faSearch,
  faLock,
  faMobileAlt,
  faPalette,
  faFileImport,
  faDownload,
  faBrain,
  faPenNib,
  faRobot,
  faLanguage,
  faCode,
  faSyncAlt,
  faBookmark,
  faStar,
  faUserPlus,
  faEdit,
  faCheckCircle,
  faQuoteLeft,
  faGlobe,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";

// FeatureCard Component
const FeatureCard = ({ feature, index }) => (
  <Tilt
    tiltMaxAngleX={20}
    tiltMaxAngleY={20}
    perspective={800}
    scale={1.05}
    className="w-full group"
  >
    <motion.div
      className="bg-white bg-opacity-10 backdrop-blur-lg text-gray-800 p-6 rounded-2xl shadow-2xl text-center border border-white border-opacity-20 hover:border-purple-500 transition-all duration-300 relative overflow-hidden"
      initial={{ opacity: 0, y: 60, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, type: "spring" }}
      whileHover={{ scale: 1.1, rotateY: 5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.4)" }}
      data-aos="zoom-in"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <FontAwesomeIcon
        icon={feature.icon}
        className="text-purple-400 text-5xl mb-4 drop-shadow-lg"
      />
      <h3 className="font-bold text-xl mb-2 text-white">{feature.title}</h3>
      <p className="text-gray-200 text-sm">{feature.description}</p>
      <div className="absolute -top-0 -right-1 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore
      </div>
    </motion.div>
  </Tilt>
);

// TestimonialCard Component
const TestimonialCard = ({ review }) => (
  <Tilt
    tiltMaxAngleX={15}
    tiltMaxAngleY={15}
    perspective={1000}
    scale={1.03}
    className="w-full"
  >
    <motion.div
      className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-center mx-2 border border-white border-opacity-20 hover:border-blue-400 transition-all duration-300"
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
    >
      <FontAwesomeIcon icon={faQuoteLeft} className="text-purple-400 text-2xl mb-4 opacity-60" />
      <p className="text-gray-200 mb-4 font-light">"{review.quote}"</p>
      <div className="flex justify-center mb-2">
        {[...Array(review.rating)].map((_, i) => (
          <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400" />
        ))}
      </div>
      <p className="text-white font-semibold">{review.name}</p>
    </motion.div>
  </Tilt>
);

const Home = () => {
  const Navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
      easing: "ease-in-out-back",
    });

    // Quote cycling for Quotes section
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 4000);

    return () => clearInterval(quoteInterval);
  }, []);

  const features = [
    {
      icon: faCloudUploadAlt,
      title: "Secure Cloud Storage",
      description: "Access your notes anywhere with robust cloud backups.",
    },
    {
      icon: faSearch,
      title: "Smart Search",
      description: "Instantly find notes with advanced search tools.",
    },
    {
      icon: faLock,
      title: "Top-Tier Encryption",
      description: "Your data is safeguarded with end-to-end encryption.",
    },
    {
      icon: faMobileAlt,
      title: "Cross-Platform Sync",
      description: "Seamless access on desktop, mobile, and tablet.",
    },
    {
      icon: faPalette,
      title: "Custom Themes",
      description: "Personalize your workspace with vibrant themes.",
    },
    {
      icon: faFileImport,
      title: "Easy Import/Export",
      description: "Move notes between apps with ease.",
    },
    {
      icon: faDownload,
      title: "Offline Access",
      description: "Work offline and sync when connected.",
    },
    {
      icon: faBrain,
      title: "AI Assistance",
      description: "Smart suggestions for better organization.",
    },
    {
      icon: faPenNib,
      title: "Handwriting OCR",
      description: "Convert handwritten notes to digital text.",
    },
    {
      icon: faRobot,
      title: "Automated Tasks",
      description: "Streamline workflows with automation.",
    },
    {
      icon: faLanguage,
      title: "Multilingual",
      description: "Support for multiple languages and translations.",
    },
    {
      icon: faCode,
      title: "Code Snippets",
      description: "Organize code for quick access.",
    },
    {
      icon: faSyncAlt,
      title: "Instant Sync",
      description: "Keep notes updated across devices.",
    },
    {
      icon: faBookmark,
      title: "Web Bookmarks",
      description: "Save and organize web links with notes.",
    },
    {
      icon: faGlobe,
      title: "Public Sharing",
      description: "Share notes via unique links.",
    },
  ];

  const reviews = [
    {
      name: "Amit Sharma",
      quote: "ApniNoteBook revolutionized my study routine!",
      rating: 5,
    },
    {
      name: "Priya Patel",
      quote: "Flawless sync for project management.",
      rating: 4,
    },
    {
      name: "Rahul Verma",
      quote: "AI suggestions are a game-changer!",
      rating: 5,
    },
    {
      name: "Sneha Gupta",
      quote: "Themes make note-taking fun!",
      rating: 4,
    },
    {
      name: "Vikram Singh",
      quote: "Offline mode is perfect for travel!",
      rating: 5,
    },
  ];

  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const startIndex = dayOfYear % reviews.length;
  const selectedReviews = [
    reviews[startIndex % reviews.length],
    reviews[(startIndex + 1) % reviews.length],
    reviews[(startIndex + 2) % reviews.length],
    reviews[(startIndex + 3) % reviews.length],
  ];

  const howItWorksSteps = [
    {
      icon: faUserPlus,
      title: "Sign Up",
      description: "Join in seconds with a quick signup.",
    },
    {
      icon: faEdit,
      title: "Create Notes",
      description: "Capture and organize your ideas.",
    },
    {
      icon: faCheckCircle,
      title: "Stay Organized",
      description: "Access notes anytime, anywhere.",
    },
  ];

  const faqs = [
    {
      question: "How do I create a new note?",
      answer: "Click 'New Note' in the dashboard to start.",
    },
    {
      question: "Can I share my notes?",
      answer: "Yes, share via a unique link in note settings.",
    },
    {
      question: "Is there a mobile app?",
      answer: "Available on iOS and Android.",
    },
    {
      question: "How secure is my data?",
      answer: "Protected with end-to-end encryption.",
    },
    {
      question: "Can I work offline?",
      answer: "Edit offline and sync when online.",
    },
    {
      question: "How to import notes?",
      answer: "Use the import tool in settings.",
    },
    {
      question: "What languages are supported?",
      answer: "Multiple languages with translation tools.",
    },
  ];

  const [openFAQ, setOpenFAQ] = useState(null);

  const quotes = [
    "Start where you are. Use what you have. Do what you can. – Arthur Ashe",
    "The future depends on what you do today. – Mahatma Gandhi",
    "You don’t have to be great to start, but you have to start to be great. – Zig Ziglar",
    "Dream big, work hard, stay focused. – Anonymous",
    "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

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

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans">
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
          @keyframes quoteFlip {
            0% { opacity: 0; transform: rotateX(90deg); }
            50% { opacity: 1; transform: rotateX(0deg); }
            100% { opacity: 0; transform: rotateX(-90deg); }
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
          onClick={() => Navigate("/login")}
        >
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          Get Started
        </motion.button>
      </motion.div>

      {/* Navigation Dots */}
      <div className="nav-dot">
        {[
          { id: "hero", name: "Home" },
          { id: "features", name: "Features" },
          { id: "testimonials", name: "Testimonials" },
          { id: "how-it-works", name: "How It Works" },
          { id: "faq", name: "FAQ" },
          { id: "tailored", name: "Tailored" },
          { id: "quotes", name: "Quotes" },
          { id: "cta", name: "Join Now" },
        ].map((section, index) => (
          <motion.span
            key={section.id}
            className={scrollProgress > index * 12.5 && scrollProgress < (index + 1) * 12.5 ? "active" : ""}
            data-section={section.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" })}
          />
        ))}
      </div>

      {/* Hero Section */}
      <header className="relative text-center py-48 animated-gradient" id="hero">
        <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} perspective={1000}>
          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, type: "spring", stiffness: 80 }}
            >
              <Typed
                strings={[
                  "Welcome to <span style='color: #FFD700;'>ApniNoteBook</span>",
                  "Your All-in-One <span style='color: #FFD700;'>Workspace</span>",
                  "<span style='color: #FFD700;'>Organize, Collaborate, Succeed!</span>",
                ]}
                typeSpeed={60}
                backSpeed={40}
                loop
              />
            </motion.h1>
            <motion.p
              className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              Empower your productivity with a seamless, secure, and smart note-taking experience.
            </motion.p>
          </div>
        </Tilt>
      </header>

      {/* Features Section */}
      <section className="py-24 animated-gradient" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 animated-gradient" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            What Our Users Say
          </motion.h2>
          <Slider {...sliderSettings}>
            {selectedReviews.map((review, index) => (
              <TestimonialCard key={index} review={review} />
            ))}
          </Slider>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 animated-gradient" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <Tilt
                key={index}
                tiltMaxAngleX={15}
                tiltMaxAngleY={15}
                perspective={1000}
                scale={1.03}
              >
                <motion.div
                  className="bg-white bg-opacity-10 backdrop-blur-lg text-center p-8 rounded-2xl shadow-xl border border-white/20 hover:border-purple-400"
                  initial={{ opacity: 0, y: 40, rotateX: 15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2, type: "spring" }}
                  whileHover={{ y: -10, rotateY: 5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.3)" }}
                >
                  <FontAwesomeIcon
                    icon={step.icon}
                    className="text-purple-400 text-5xl mb-4 drop-shadow-lg"
                  />
                  <h3 className="font-bold text-xl mb-2 text-white">{step.title}</h3>
                  <p className="text-gray-200">{step.description}</p>
                </motion.div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 animated-gradient" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl cursor-pointer border border-white/20 hover:border-purple-400 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.3)" }}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <h3 className="font-semibold text-lg mb-2 text-white">{faq.question}</h3>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.p
                      className="text-gray-200"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to Expand
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tailored Content Section */}
      <section className="py-24 animated-gradient" id="tailored">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            For Students and Professionals
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20} perspective={800} scale={1.05}>
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-center border border-white/20 hover:border-purple-400"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -10, rotateY: 5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.3)" }}
              >
                <motion.img
                  src={Student}
                  alt="Student"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=Student")}
                />
                <FontAwesomeIcon icon={faPenNib} className="text-purple-400 text-4xl mb-4" />
                <h3 className="font-bold text-xl mb-2 text-white">For Students</h3>
                <p className="text-gray-200">
                  Organize study materials, manage assignments, and collaborate with classmates effortlessly.
                </p>
              </motion.div>
            </Tilt>
            <Tilt tiltMaxAngleX={20} tiltMaxAngleY={20} perspective={800} scale={1.05}>
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl shadow-xl text-center border border-white/20 hover:border-purple-400"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -10, rotateY: -5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.3)" }}
              >
                <motion.img
                  src={Professional}
                  alt="Professional"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/300x200?text=Professional")}
                />
                <FontAwesomeIcon icon={faCode} className="text-purple-400 text-4xl mb-4" />
                <h3 className="font-bold text-xl mb-2 text-white">For Professionals</h3>
                <p className="text-gray-200">
                  Streamline projects, manage workflows, and collaborate with your team in real-time.
                </p>
              </motion.div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <section
        className="py-20 animated-gradient text-white text-center relative"
        id="quotes"
        data-aos="fade-in"
      >
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-12 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Inspirational Quotes
          </motion.h2>
          <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} perspective={1000}>
            <motion.div
              className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 hover:border-purple-400 relative overflow-hidden"
              style={{ animation: "quoteFlip 4s infinite" }}
              whileHover={{ scale: 1.1, rotateY: 10, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <FontAwesomeIcon
                icon={faQuoteLeft}
                className="text-purple-300 text-4xl mb-4 opacity-40 absolute top-4 left-4"
              />
              <div className="text-3xl lg:text-5xl font-bold italic text-gray-100 relative z-10">
                "{quotes[currentQuote]}"
              </div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-500 rounded-full opacity-10 blur-2xl transform translate-x-10 translate-y-10" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
            </motion.div>
          </Tilt>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl lg:text-9xl font-extrabold opacity-10 select-none pointer-events-none">
            ApniNoteBook
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-24 animated-gradient" id="cta">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-8 text-white"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            data-aos="fade-up"
          >
            Ready to Unlock Your Potential?
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Join thousands of users who trust ApniNoteBook to stay organized and productive.
          </motion.p>
          <motion.button
            className="bg-yellow-300 text-gray-800 py-4 px-8 rounded-full shadow-lg hover:bg-yellow-400 transition text-lg font-semibold"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.1, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => Navigate("/login")}
          >
            Join Now
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default Home;