import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import ApniNoteBook from "../../images/inotebookgif.webp";
import {
  FaCloud,
  FaLock,
  FaSearch,
  FaMobileAlt,
  FaTags,
  FaEdit,
  FaPalette,
  FaDatabase,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket } from "@fortawesome/free-solid-svg-icons";

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
      easing: "ease-in-out-back",
    });
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

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans animated-gradient ">
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
          onClick={() => navigate("/login")}
        >
          <FontAwesomeIcon icon={faRocket} className="mr-2" />
          Start Now
        </motion.button>
      </motion.div>

      {/* Navigation Dots */}
      <div className="nav-dot">
        {[
          { id: "header", name: "Introduction" },
          { id: "why", name: "Why ApniNoteBook" },
          { id: "key-features", name: "Key Features" },
          { id: "more-features", name: "More Features" },
          { id: "developer", name: "About Developer" },
          { id: "cta", name: "Join Now" },
        ].map((section, index) => (
          <motion.span
            key={section.id}
            className={scrollProgress > index * 16.67 && scrollProgress < (index + 1) * 16.67 ? "active" : ""}
            data-section={section.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" })}
          />
        ))}
      </div>

      {/* Header Section */}
      <div
        className="container mx-auto text-center mb-16 px-4 sm:px-6 pt-12"
        id="header"
        data-aos="fade-down"
      >
        <motion.h1
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 80 }}
        >
          Discover <span className="text-yellow-400">ApniNoteBook</span>
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Your all-in-one solution for effortless note-taking, organization, and productivity—crafted with passion and precision.
        </motion.p>
        <motion.p
          className="text-sm sm:text-base italic mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Created by <span className="font-bold text-yellow-300">Tanish Jain</span>—where innovation meets simplicity.
        </motion.p>
      </div>

      {/* Main Content */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-16"
        id="why"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
          {/* Text Section */}
          <motion.div
            data-aos="fade-right"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Why ApniNoteBook Stands Out</h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-6">
              ApniNoteBook is more than just a note-taking app—it’s a productivity powerhouse designed to simplify your life. Whether you're a student, professional, or creative, it adapts to your needs with unmatched flexibility.
            </p>
            <ul className="space-y-4">
              {[
                { text: "Seamless cloud sync across all your devices.", icon: <FaCloud /> },
                { text: "Top-tier security to keep your notes safe.", icon: <FaLock /> },
                { text: "Powerful search to find notes instantly.", icon: <FaSearch /> },
              ].map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {item.icon}
                  <span className="ml-2 text-sm sm:text-base">{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          {/* Image Section */}
          <motion.div
            data-aos="fade-left"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} perspective={1000}>
              <motion.img
                src={ApniNoteBook}
                alt="ApniNoteBook in Action"
                className="w-full rounded-xl shadow-2xl"
                initial={{ y: 0 }}
                animate={{ y: [-10, 10] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=ApniNoteBook")}
              />
            </Tilt>
          </motion.div>
        </div>
      </div>

      {/* Key Features */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-16 mt-12 sm:mt-16"
        id="key-features"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          What Makes ApniNoteBook Special
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title: "Secure Cloud Backup",
              desc: "Access your notes anytime, anywhere with top-tier security.",
              icon: <FaCloud className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-yellow-400" />,
            },
            {
              title: "Effortless UI",
              desc: "A clean, distraction-free interface to keep you focused.",
              icon: <FaMobileAlt className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-yellow-400" />,
            },
            {
              title: "Smart Organization",
              desc: "Tags, folders, and search to find notes in a snap.",
              icon: <FaSearch className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-yellow-400" />,
            },
          ].map((feature, index) => (
            <Tilt
              key={index}
              tiltMaxAngleX={20}
              tiltMaxAngleY={20}
              perspective={800}
              scale={1.05}
              className="w-full group"
            >
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg text-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl text-center border border-white border-opacity-20 hover:border-purple-500 transition-all duration-300 relative overflow-hidden"
                initial={{ opacity: 0, y: 60, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2, type: "spring" }}
                whileHover={{ scale: 1.1, rotateY: 5, boxShadow: "0 15px 30px rgba(147, 51, 234, 0.4)" }}
                data-aos="zoom-in"
                data-aos-delay={index * 200}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {feature.icon}
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 mt-4">{feature.title}</h3>
                <p className="text-gray-200 text-sm sm:text-base">{feature.desc}</p>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore
                </div>
              </motion.div>
            </Tilt>
          ))}
        </div>
      </div>

      {/* Additional Features */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-16 mt-12 sm:mt-16"
        id="more-features"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Even More to Love
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { text: "Intuitive tagging system", icon: <FaTags className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" /> },
            { text: "Rich text formatting", icon: <FaEdit className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" /> },
            { text: "Customizable themes", icon: <FaPalette className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" /> },
            { text: "Offline access", icon: <FaDatabase className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" /> },
          ].map((feature, index) => (
            <Tilt
              key={index}
              tiltMaxAngleX={15}
              tiltMaxAngleY={15}
              perspective={1000}
              scale={1.03}
            >
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg text-white p-4 sm:p-6 rounded-lg shadow-md border border-white/20 hover:border-purple-400 transition-all flex items-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                data-aos="flip-up"
                data-aos-delay={index * 200}
              >
                {feature.icon}
                <p className="text-sm sm:text-base md:text-lg font-semibold">{feature.text}</p>
              </motion.div>
            </Tilt>
          ))}
        </div>
      </div>

      {/* About the Developer */}
      <div
        className="container mx-auto px-4 sm:px-6 md:px-16 mt-12 sm:mt-16"
        id="developer"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Meet the Mind Behind ApniNoteBook
        </motion.h2>
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Hi, I’m <span className="font-bold text-yellow-300">Tanish Jain</span>, a passionate MERN Stack Developer with a knack for building intuitive, user-focused applications. With expertise in React.js, Tailwind CSS, and Node.js, I created ApniNoteBook to solve everyday note-taking challenges with a modern twist.
          </motion.p>
          <motion.p
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            When I’m not coding, I’m exploring new tech trends or working on other exciting projects. Check out my portfolio at{" "}
            <a
              href="https://tanishjain.in"
              className="text-yellow-300 underline hover:text-yellow-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              tanishjain.in <FaExternalLinkAlt className="inline w-4 h-4 ml-1" />
            </a>{" "}
            to see more of my work!
          </motion.p>
        </div>
      </div>

      {/* Call-to-Action */}
      <div
        className="container mx-auto text-center mt-12 sm:mt-16 pb-16 px-4 sm:px-6"
        id="cta"
        data-aos="fade-up"
      >
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Ready to Transform Your Notes with <span className="text-yellow-400">ApniNoteBook</span>?
        </motion.h2>
        <motion.p
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Join thousands of users who’ve elevated their productivity. Sign up today and experience note-taking like never before!
        </motion.p>
        <motion.button
          className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-400 text-gray-800 text-base sm:text-lg md:text-xl font-bold rounded-lg shadow-lg hover:bg-yellow-500"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/login")}
        >
          Start Now—It’s Free!
        </motion.button>
      </div>
    </div>
  );
};

export default About;