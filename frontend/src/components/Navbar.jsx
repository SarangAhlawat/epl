import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import useAuth from "../hooks/useAuth";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { motion } from "framer-motion";

const MotionNav = motion.nav;

const navClass = ({ isActive }) => (
  `transition ${isActive ? "text-blue-800 font-semibold" : "text-slate-600 hover:text-blue-700"}`
);

function Navbar() {

  const { token } = useAuth();
  const [open, setOpen] = useState(false);

  return (

    <MotionNav

      initial={{ y: -80 }}
      animate={{ y: 0 }}

      className="sticky top-0 z-50 border-b border-white/50 bg-white/85 backdrop-blur-xl"

    >

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">

        {/* Logo */}

        <Link to="/">

          <div className="flex items-center gap-2">

            <img

              src={logo}
              alt="GetEvents logo"

              className="h-10"

            />

            <span className="text-xl font-bold text-blue-900 tracking-tight">

              GetEvents

            </span>

          </div>

        </Link>

        {/* Menu */}

        <div className="hidden md:flex gap-8 font-medium">

          <NavLink to="/events" className={navClass}>

            Public Events

          </NavLink>

          <NavLink to="/about" className={navClass}>

            About

          </NavLink>

          <NavLink to="/how-to-use" className={navClass}>

            How to Use

          </NavLink>

        </div>

        {/* Auth Buttons */}

        <div className="hidden md:flex gap-3 items-center">

          {token ? (
            <Link to="/dashboard">
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg">
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login">

                <button className="px-5 py-2 border rounded-lg">

                  Login

                </button>

              </Link>

              <Link to="/signup">

                <button className="px-5 py-2 bg-blue-600 text-white rounded-lg">

                  Admin Signup

                </button>

              </Link>
            </>
          )}

        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-md border border-slate-200"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <NavLink to="/events" className="block text-slate-700" onClick={() => setOpen(false)}>
            Public Events
          </NavLink>
          <NavLink to="/about" className="block text-slate-700" onClick={() => setOpen(false)}>
            About
          </NavLink>
          <NavLink to="/how-to-use" className="block text-slate-700" onClick={() => setOpen(false)}>
            How to Use
          </NavLink>
          {token ? (
            <Link to="/dashboard" className="block text-blue-700 font-semibold" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="text-center border rounded-md py-2">
                Login
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="text-center bg-blue-600 text-white rounded-md py-2">
                Admin Signup
              </Link>
            </div>
          )}
        </div>
      )}

    </MotionNav>

  );

}

export default Navbar;