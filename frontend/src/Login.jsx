import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import { useAuth } from "./AuthContext";

import "./Auth.css";

function Login() {

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==========================================
  // Login Submit
  // ==========================================

  const submit = async (e) => {

    e.preventDefault();

    // ==========================================
    // Validate Email and Password
    // ==========================================

    if (

      !email.trim() &&

      !password.trim()

    ) {

      toast.warning(

        "Please enter email and password."

      );

      return;

    }

    // ==========================================
    // Validate Email
    // ==========================================

    if (!email.trim()) {

      toast.warning(

        "Please enter your email."

      );

      return;

    }

    // ==========================================
    // Validate Password
    // ==========================================

    if (!password.trim()) {

      toast.warning(

        "Please enter your password."

      );

      return;

    }

    setLoading(true);

    try {

      const success = await login(

        email.trim().toLowerCase(),

        password

      );

      if (success) {

        toast.success(

          "Login Successful 🎉"

        );

      } else {

        toast.error(

          "Invalid Email or Password."

        );

      }

    } catch (error) {

      console.error(

        "Login Error:",

        error

      );

      toast.error(

        "Unable to connect to the server."

      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="auth-container">

      <motion.div

        className="auth-card"

        initial={{

          opacity: 0,

          y: 80,

        }}

        animate={{

          opacity: 1,

          y: 0,

        }}

        transition={{

          duration: 0.7,

        }}

      >

        {/* ================================
            Logo
        ================================= */}

        <div className="logo">

          <FaShieldAlt />

          <h1>SentinelCore</h1>

        </div>

        <h2>

          SecureOps Login

        </h2>

        <p>

          Enterprise Security Operations Center

        </p>

        {/* ================================
            Login Form
        ================================= */}

        <form onSubmit={submit}>

          {/* Email */}

          <input

            type="email"

            placeholder="Email Address"

            value={email}

            onChange={(e) =>

              setEmail(e.target.value)

            }

          />

          {/* Password */}

          <div className="password-box">

            <input
             
              type={

                showPassword

                  ? "text"

                  : "password"

              }

              placeholder="Password"

              value={password}

              onChange={(e) =>

                setPassword(e.target.value)

              }

            />

            <button

              type="button"

              className="eye"

              onClick={() =>

                setShowPassword(

                  !showPassword

                )

              }

            >

              {showPassword ? (

                <FaEyeSlash />

              ) : (

                <FaEye />

              )}

            </button>

          </div>

          {/* Login Button */}

          <button

            type="submit"

            className="login-btn"

            disabled={loading}

          >

            {loading

              ? "Authenticating..."

              : "Login"}

          </button>

        </form>

        {/* ================================
            Register Link
        ================================= */}

        <div className="bottom-link">

          Don't have an account?

          <Link to="/register">

            Register

          </Link>

        </div>

      </motion.div>

    </div>

  );

}

export default Login;