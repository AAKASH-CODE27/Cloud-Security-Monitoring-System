import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHome, FaExclamationTriangle } from "react-icons/fa";

import "./NotFound.css";

export default function NotFound() {
  return (
    <motion.div
      className="notfound-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="notfound-card"
        initial={{ scale: .9 }}
        animate={{ scale: 1 }}
      >
        <FaExclamationTriangle className="error-icon"/>

        <h1>404</h1>

        <h2>Page Not Found</h2>

        <p>
          The page you're looking for doesn't exist or
          has been moved.
        </p>

        <Link
          to="/"
          className="back-home"
        >
          <FaHome />

          Dashboard
        </Link>

      </motion.div>
    </motion.div>
  );
}