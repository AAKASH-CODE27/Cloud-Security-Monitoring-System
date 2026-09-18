import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLock, FaHome } from "react-icons/fa";

import "./Unauthorized.css";

export default function Unauthorized() {
  return (
    <motion.div
      className="unauthorized-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="unauthorized-card"
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="lock-icon">
          <FaLock />
        </div>

        <h1>403</h1>

        <h2>Access Denied</h2>

        <p>
          You don't have permission to access this page.
          Please contact your administrator if you believe
          this is an error.
        </p>

        <Link
          to="/"
          className="home-btn"
        >
          <FaHome />
          Back to Dashboard
        </Link>

      </motion.div>
    </motion.div>
  );
}