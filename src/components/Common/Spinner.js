import React from "react";
import { FaBookOpen } from "react-icons/fa";

const Spinner = () => (
  <>
    <style>{`
      @keyframes iconMultiAxis3D {
        0% {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1) translateZ(0);
          opacity: 0.9;
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) brightness(1);
        }
        50% {
          transform: perspective(1200px) rotateY(180deg) rotateX(30deg) rotateZ(10deg) scale(1.3) translateZ(40px);
          opacity: 1;
          filter: drop-shadow(0 0 35px rgba(255, 255, 255, 1)) brightness(1.2);
        }
        100% {
          transform: perspective(1200px) rotateY(360deg) rotateX(0deg) rotateZ(0deg) scale(1) translateZ(0);
          opacity: 0.9;
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) brightness(1);
        }
      }
      @keyframes textWave3D {
        0% {
          transform: perspective(600px) rotateX(0deg) translateY(0) translateZ(0);
          color: #ffffff;
          opacity: 0.85;
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
        }
        50% {
          transform: perspective(600px) rotateX(120deg) translateY(-12px) translateZ(20px);
          color: #c7d2fe;
          opacity: 1;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9));
        }
        100% {
          transform: perspective(600px) rotateX(0deg) translateY(0) translateZ(0);
          color: #ffffff;
          opacity: 0.85;
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
        }
      }
      @keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .animate-icon {
        animation: iconMultiAxis3D 4.5s infinite ease-in-out;
      }
      .animate-text {
        animation: textWave3D 2.8s infinite ease-in-out;
      }
      .animated-gradient {
        background: linear-gradient(270deg, #3b82f6, #9333ea);
        background-size: 400% 400%;
        animation: gradientAnimation 12s ease infinite;
      }
      .animate-fadeInOut {
        animation: fadeInOut 2s infinite ease-in-out;
      }
      .container {
        perspective: 1500px;
        max-width: 100vw;
        overflow: hidden;
      }
    `}</style>

    <div className="flex flex-col items-center justify-center min-h-screen animated-gradient px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 container relative overflow-hidden">
      {/* 3D Book Icon */}
      <FaBookOpen
        className="text-white animate-icon text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
      />

      {/* 3D Wave Text */}
      <div className="flex flex-row items-center justify-center gap-0.5 sm:gap-0.75 md:gap-1 lg:gap-1.5 mt-5 sm:mt-6 md:mt-8 lg:mt-10 py-2 w-full max-w-[80vw] overflow-x-auto whitespace-nowrap">
        {Array.from("ApniNoteBook").map((char, idx) => (
          <span
            key={idx}
            className="inline-block animate-text font-extrabold text-white text-[clamp(0.8rem,2.8vw,3rem)]"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Loading Text */}
    
    </div>
  </>
);

export default Spinner;