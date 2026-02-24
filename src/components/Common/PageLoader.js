import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const PageLoader = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    let isDone = false;

    // Start the progress bar
    NProgress.start();

    // Simulate loading complete after a short delay
    const timeout = setTimeout(() => {
      NProgress.done();
      isDone = true;
    }, 200); // 200ms delay for smoothness

    return () => {
      if (!isDone) {
        NProgress.done();
      }
      clearTimeout(timeout);
    };
  }, [location]);

  useEffect(() => {
    const handlePageLoad = () => {
      NProgress.done();
    };

    window.addEventListener("load", handlePageLoad);

    return () => {
      window.removeEventListener("load", handlePageLoad);
    };
  }, []);

  return <>{children}</>;
};

export default PageLoader;
