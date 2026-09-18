import { FaGithub, FaLinkedin, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import "./Dashboard.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <motion.footer
      className="dashboard-footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="footer-left">
        <div className="footer-logo">
          <FaShieldAlt />
        </div>

        <div>
          <h3>SentinelCore SecureOps</h3>
          <p>
            Enterprise Infrastructure Monitoring &
            Security Operations Center
          </p>
        </div>
      </div>

      <div className="footer-center">
        <div className="footer-item">
          <h4>System Status</h4>

          <span className="status online"></span>

          All Services Operational
        </div>

        <div className="footer-item">
          <h4>Version</h4>

          <p>v2.0.0 Enterprise</p>
        </div>

        <div className="footer-item">
          <h4>Environment</h4>

          <p>Production</p>
        </div>
      </div>

      <div className="footer-right">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
        >
          <FaGithub />
        </a>

        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noreferrer"
        >
          <FaLinkedin />
        </a>

        <p>© {year} SentinelCore SecureOps</p>

        <small>
          Built with React • Spring Boot • PostgreSQL
        </small>
      </div>
    </motion.footer>
  );
}

export default Footer;