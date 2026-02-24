import React from "react";
import { Link } from "react-router-dom";
import { FaBookOpen, FaInfoCircle, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  // Container animation for fade-in and scale
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.15,
      },
    },
  };

  // Child animation for staggered entrance
  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Icon animation with wave effect
  const iconVariants = {
    initial: { scale: 1, y: 0, opacity: 0.9 },
    hover: {
      scale: 1.4,
      y: -5,
      opacity: 1,
      transition: { type: "spring", stiffness: 500, damping: 15, repeat: 1, repeatType: "reverse" },
    },
  };

  // Link animation with glow effect
  const linkVariants = {
    initial: { scale: 1, y: 0, opacity: 0.9 },
    animate: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.4 } },
    hover: {
      scale: 1.15,
      color: "#ffffff",
      textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  // Logo pulse animation
  const logoVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" },
    },
  };

  return (
    <motion.footer
      className="bg-gradient-to-r from-gray-900 to-black text-gray-300 py-6 sm:py-10 lg:py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-start justify-items-center">
          {/* Branding */}
          <motion.div variants={childVariants} className="flex flex-col items-center sm:items-start">
            <div className="flex items-center space-x-3">
              <motion.div variants={logoVariants} initial="initial" animate="animate">
                <FaBookOpen className="text-blue-400 text-2xl sm:text-3xl lg:text-4xl" aria-hidden="true" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide">ApniNoteBook</h2>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-gray-400 mt-2 text-center sm:text-left max-w-[16rem] sm:max-w-xs">
              Secure and organized note-keeping for everyone.
            </p>
          </motion.div>

          {/* Navigation Links */}
          <motion.div
            variants={childVariants}
            className="flex flex-col items-center space-y-3 sm:space-y-4 lg:flex-row lg:space-x-8 lg:space-y-0"
          >
            <motion.div whileHover="hover" variants={linkVariants} initial="initial" animate="animate">
              <Link
                to="/about"
                className="text-gray-400 text-sm sm:text-base lg:text-lg flex items-center space-x-1.5"
                aria-label="About page"
              >
                <FaInfoCircle aria-hidden="true" />
                <span>About</span>
              </Link>
            </motion.div>
            <motion.div whileHover="hover" variants={linkVariants} initial="initial" animate="animate">
              <Link
                to="/contact"
                className="text-gray-400 text-sm sm:text-base lg:text-lg flex items-center space-x-1.5"
                aria-label="Contact page"
              >
                <FaEnvelope aria-hidden="true" />
                <span>Contact</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Social Media Icons */}
          <motion.div variants={childVariants} className="flex space-x-3 sm:space-x-4 lg:space-x-6">
            <motion.a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500"
              aria-label="Visit our Facebook page"
              variants={iconVariants}
              whileHover="hover"
              initial="initial"
            >
              <FaFacebookF className="text-base sm:text-lg lg:text-xl" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400"
              aria-label="Visit our Twitter page"
              variants={iconVariants}
              whileHover="hover"
              initial="initial"
            >
              <FaTwitter className="text-base sm:text-lg lg:text-xl" />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400"
              aria-label="Visit our Instagram page"
              variants={iconVariants}
              whileHover="hover"
              initial="initial"
            >
              <FaInstagram className="text-base sm:text-lg lg:text-xl" />
            </motion.a>
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-300"
              aria-label="Visit our GitHub page"
              variants={iconVariants}
              whileHover="hover"
              initial="initial"
            >
              <FaGithub className="text-base sm:text-lg lg:text-xl" />
            </motion.a>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          variants={childVariants}
          className="mt-6 sm:mt-8 lg:mt-10 text-center text-xs sm:text-sm lg:text-base text-gray-500 border-t border-gray-700 pt-4"
        >
          © {new Date().getFullYear()} ApniNoteBook. Built with{" "}
          <motion.span
            className="text-red-400 inline-block"
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            ❤️
          </motion.span>{" "}
          by{" "}
          <Link
            to="/"
            className="underline text-gray-400 hover:text-gray-300 transition duration-300"
            aria-label="Home page"
          >
            Tanish
          </Link>
          .
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;