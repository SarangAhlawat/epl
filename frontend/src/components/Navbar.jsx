import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

import { motion } from "framer-motion";

function Navbar() {

  return (

    <motion.nav

      initial={{ y: -80 }}
      animate={{ y: 0 }}

      className="bg-white shadow-md sticky top-0 z-50"

    >

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}

        <Link to="/">

          <div className="flex items-center gap-2">

            <img

              src={logo}

              className="h-10"

            />

            <span className="text-xl font-bold text-blue-900">

              GetEvents

            </span>

          </div>

        </Link>

        {/* Menu */}

        <div className="hidden md:flex gap-8 font-medium text-gray-700">

          <Link to="/events">

            Public Events

          </Link>

          <Link to="/about">

            About

          </Link>

          <Link to="/how">

            How to Use

          </Link>

        </div>

        {/* Auth Buttons */}

        <div className="flex gap-3">

          <Link to="/login">

            <button className="px-5 py-2 border rounded-lg">

              Login

            </button>

          </Link>

          <Link to="/signup">

            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg">

              Signup

            </button>

          </Link>

        </div>

      </div>

    </motion.nav>

  );

}

export default Navbar;