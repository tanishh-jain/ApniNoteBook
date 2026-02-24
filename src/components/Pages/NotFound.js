import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Particles from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import { loadConfettiPreset } from '@tsparticles/preset-confetti';
import './NotFound.css';

const NotFound = ({ showAlert }) => {
  const [funMessage, setFunMessage] = useState('');
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const hasAlertedRef = useRef(false);
  const funMessageIndexRef = useRef(0);

  const messages = useMemo(() => [
    "Looks like this page took a break to jot down some ideas!",
    "Share your notes with a click—don’t let this page stop you!",
    "This page is missing, but your ideas aren’t—upload a note now!",
    "Oops, this URL got misplaced in the notebook stack!",
  ], []);

  useEffect(() => {
    if (!hasAlertedRef.current) {
      showAlert('Page not found!', 'error');
      hasAlertedRef.current = true;
    }

    const rotateMessage = () => {
      gsap.to('.fun-message', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          funMessageIndexRef.current = (funMessageIndexRef.current + 1) % messages.length;
          setFunMessage(messages[funMessageIndexRef.current]);
          gsap.to('.fun-message', {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.in',
          });
        },
      });
    };

    setFunMessage(messages[0]);
    const interval = setInterval(rotateMessage, 6000);

    return () => clearInterval(interval);
  }, [showAlert, messages]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      // 404 digits slide-in animation with bounce
      gsap.fromTo(
        '.digit-4-first',
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.2 }
      );
      gsap.fromTo(
        '.digit-0',
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.4 }
      );
      gsap.fromTo(
        '.digit-4-second',
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)', delay: 0.6 }
      );

      // Fade-slide animations for content
      gsap.fromTo(
        '.page-title, .fun-message, .sub-message, .home-link, .report-link',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.8 }
      );

      // Rotate and scale book icon
      gsap.to('.book-icon', {
        rotation: 360,
        scale: 1.1,
        duration: 5,
        ease: 'linear',
        repeat: -1,
      });

      // Background SVG animation handled in CSS
    } else {
      gsap.set('.digit-4-first, .digit-0, .digit-4-second, .page-title, .fun-message, .sub-message, .home-link, .report-link', {
        opacity: 1,
        x: 0,
        y: 0,
      });
      gsap.set('.book-icon', { scale: 1, rotation: 0 });
    }
  }, []);

  const handleLinkHover = () => {
    gsap.to('.home-link', { scale: 1.05, duration: 0.3, ease: 'power2.out' });
    gsap.to('.home-link-icon', {
      x: 5,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleLinkLeave = () => {
    gsap.to('.home-link', { scale: 1, duration: 0.3, ease: 'power2.out' });
    gsap.to('.home-link-icon', {
      x: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleFunMessageHover = () => {
    gsap.to('.fun-message', { scale: 1.02, duration: 0.3, ease: 'power2.out' });
  };

  const handleFunMessageLeave = () => {
    gsap.to('.fun-message', { scale: 1, duration: 0.3, ease: 'power2.out' });
  };

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
    await loadConfettiPreset(engine);
  }, []);

  const backgroundParticlesOptions = useMemo(() => ({
    particles: {
      number: { value: 20, density: { enable: true, value_area: 800 } },
      color: { value: ['#3b82f6', '#9333ea', '#ffffff'] },
      shape: { type: 'circle' },
      opacity: { value: 0.2, random: true },
      size: { value: 2, random: true },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'none',
        random: true,
        out_mode: 'out',
      },
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' },
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { quantity: 2 },
      },
    },
  }), []);

  const confettiParticlesOptions = useMemo(() => ({
    preset: 'confetti',
    particles: {
      number: { value: 50 },
      color: { value: ['#3b82f6', '#9333ea', '#facc15'] },
      shape: { type: 'confetti' },
      size: { value: { min: 5, max: 10 } },
      move: { enable: true, speed: 4, direction: 'top', outModes: 'destroy' },
    },
  }), []);

  const triggerConfetti = () => {
    setConfettiTriggered(true);
    setTimeout(() => setConfettiTriggered(false), 3000);
  };

  return (
    <div className="not-found-container">
      <div className="wave-bg"></div>
      <div className="wave-bg-2"></div>
      <div className="bg-overlay"></div>
      <svg className="bg-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M0,0 Q50,50 100,0 T200,0 V100 H0 Z"
          fill="rgba(255, 255, 255, 0.1)"
        >
          <animate
            attributeName="d"
            values="
              M0,0 Q50,50 100,0 T200,0 V100 H0 Z;
              M0,0 Q50,30 100,0 T200,0 V100 H0 Z;
              M0,0 Q50,50 100,0 T200,0 V100 H0 Z"
            dur="10s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      <Particles
        id="background-particles"
        init={particlesInit}
        options={backgroundParticlesOptions}
        className="absolute inset-0 z-0"
      />
      {confettiTriggered && (
        <Particles
          id="confetti-particles"
          init={particlesInit}
          options={confettiParticlesOptions}
          className="absolute inset-0 z-0"
        />
      )}
      <div className="content-wrapper">
        <svg className="book-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 2v20" />
        </svg>
        <div className="error-code-wrapper">
          <h1 className="error-code" aria-label="404 error code">
            <span className="digit-4-first">4</span>
            <span className="digit-0">0</span>
            <span className="digit-4-second">4</span>
          </h1>
        </div>
        <h2 className="page-title">
          Page Not Found—Let’s Get You Back to Creating!
        </h2>
        <p
          className="fun-message"
          onMouseEnter={handleFunMessageHover}
          onMouseLeave={handleFunMessageLeave}
          aria-label="Fun message"
        >
          {funMessage}
        </p>
        <p className="sub-message">
          This page doesn’t exist or has been moved. Let’s return to your notes.
        </p>
        <div className="action-buttons">
          <Link
            to="/"
            className="home-link"
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
            onClick={triggerConfetti}
            role="button"
            aria-label="Return to homepage"
          >
            <svg className="home-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 2v20" />
            </svg>
            ApniNoteBook
          </Link>
          <a
            href="mailto:apninotebook@gmail.com?subject=404 Page Not Found Issue"
            className="report-link"
            aria-label="Report this issue"
          >
            Report an Issue
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;