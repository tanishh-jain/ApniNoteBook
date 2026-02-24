import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

const Alert = ({
  alert,
  onClose,
  duration,
  dismissible,
  position,
  preventAutoClose,
  customIcon,
  customButtonText,
  customClass,
  borderStyle,
  glowIntensity,
}) => {
  const defaults = {
    duration: 3000,
    dismissible: true,
    position: "top-right",
    preventAutoClose: false,
    customButtonText: "Close",
    borderStyle: "solid",
    glowIntensity: "medium",
  };

  const finalDuration = duration ?? defaults.duration;
  const finalDismissible = dismissible ?? defaults.dismissible;
  const finalPosition = position ?? defaults.position;
  const finalPreventAutoClose = preventAutoClose ?? defaults.preventAutoClose;
  const finalCustomButtonText = customButtonText ?? defaults.customButtonText;
  const finalBorderStyle = borderStyle ?? defaults.borderStyle;
  const finalGlowIntensity = glowIntensity ?? defaults.glowIntensity;

  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const alertRef = useRef(null);

  const getAlertType = (type) => {
    if (type === "danger") return "Error";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getDefaultIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "danger":
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const positionClasses = {
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-center": "top-6 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  const glowClasses = {
    low: "shadow-md",
    medium: "shadow-lg shadow-gray-400/20",
    high: "shadow-xl shadow-gray-500/30",
  };

  const positionClass = positionClasses[finalPosition] || positionClasses["top-right"];
  const glowClass = glowClasses[finalGlowIntensity] || glowClasses["medium"];

  useEffect(() => {
    if (!finalPreventAutoClose && !isHovered) {
      const interval = 1000 / 60;
      const increment = (interval / finalDuration) * 100;
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            if (onClose) onClose();
            return 100;
          }
          return prev + increment;
        });
      }, interval);
      return () => clearInterval(timer);
    }
  }, [finalPreventAutoClose, isHovered, finalDuration, onClose]);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }}
          exit={{ opacity: 0, y: -60, scale: 0.85, transition: { duration: 0.25, ease: "easeIn" } }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className={`fixed z-50 w-full max-w-xs sm:max-w-sm md:max-w-md ${positionClass} ${customClass}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          ref={alertRef}
        >
          <div
            className={`relative p-5 rounded-2xl border-2 ${finalBorderStyle === "dashed" ? "border-dashed" : "border-solid"} 
              backdrop-blur-md bg-opacity-80 ${glowClass}
              ${alert.type === "success" ? "bg-gradient-to-br from-green-100/80 to-green-200/80 border-green-400 text-green-900" : ""}
              ${alert.type === "danger" ? "bg-gradient-to-br from-red-100/80 to-red-200/80 border-red-400 text-red-900" : ""}
              ${alert.type === "info" ? "bg-gradient-to-br from-blue-100/80 to-blue-200/80 border-blue-400 text-blue-900" : ""}
              transition-all duration-300 hover:ring-4 hover:ring-opacity-50
              ${alert.type === "success" ? "hover:ring-green-300" : ""}
              ${alert.type === "danger" ? "hover:ring-red-300" : ""}
              ${alert.type === "info" ? "hover:ring-blue-300" : ""}`}
            role="alert"
            aria-describedby="alert-message"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">{customIcon || getDefaultIcon(alert.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-xl font-bold tracking-tight">{getAlertType(alert.type)}</strong>
                    <p id="alert-message" className="mt-1.5 text-sm leading-relaxed">{alert.msg}</p>
                  </div>
                  {finalDismissible && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                      aria-label={finalCustomButtonText}
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-800" />
                    </button>
                  )}
                </div>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`mt-4 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md
                      ${alert.type === "success" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                      ${alert.type === "danger" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                      ${alert.type === "info" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
            </div>
            {!finalPreventAutoClose && (
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 rounded-b-xl overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-linear
                    ${alert.type === "success" ? "bg-green-400" : ""}
                    ${alert.type === "danger" ? "bg-red-400" : ""}
                    ${alert.type === "info" ? "bg-blue-400" : ""}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Alert.propTypes = {
  alert: PropTypes.shape({
    type: PropTypes.oneOf(["success", "danger", "info"]).isRequired,
    msg: PropTypes.string.isRequired,
    action: PropTypes.shape({
      label: PropTypes.string,
      onClick: PropTypes.func,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
  dismissible: PropTypes.bool,
  position: PropTypes.oneOf(["top-right", "top-left", "bottom-right", "bottom-left", "top-center", "bottom-center"]),
  preventAutoClose: PropTypes.bool,
  customIcon: PropTypes.element,
  customButtonText: PropTypes.string,
  customClass: PropTypes.string,
  borderStyle: PropTypes.oneOf(["solid", "dashed"]),
  glowIntensity: PropTypes.oneOf(["low", "medium", "high"]),
};

export default Alert;