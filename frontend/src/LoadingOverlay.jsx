import { motion, AnimatePresence } from "framer-motion";
import "./LoadingOverlay.css";

export default function LoadingOverlay({

  loading,

  message = "Loading..."

}) {

  return (

    <AnimatePresence>

      {loading && (

        <motion.div

          className="loading-overlay"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

        >

          <motion.div

            className="loading-box"

            initial={{
              scale: .8
            }}

            animate={{
              scale: 1
            }}

            transition={{
              duration: .25
            }}

          >

            <div className="spinner"></div>

            <h3>

              {message}

            </h3>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  );

}