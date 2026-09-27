import { FaGithub, FaLinkedin, FaShieldAlt } from "react-icons/fa";
import "./Dashboard.css";

function Footer() {
  return (
    <footer className="dashboard-footer">

      {/* LEFT: Branding */}
      <div className="footer-left">
        <div className="footer-logo">
          <FaShieldAlt />
        </div>
        <div>
          <h3>SentinelCore SecureOps</h3>
          <p>Enterprise Security Operations Center</p>
        </div>
      </div>

      {/* RIGHT: Social links */}
      <div className="footer-right">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="footer-link"
        >
          <FaGithub />
          <span>GitHub</span>
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="footer-link"
        >
          <FaLinkedin />
          <span>LinkedIn</span>
        </a>
      </div>

    </footer>
  );
}

export default Footer;