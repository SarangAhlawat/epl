import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const MotionH1 = motion.h1;
const MotionP = motion.p;
const MotionDiv = motion.div;

function Hero() {

  const navigate = useNavigate();
  const { token } = useAuth();

  const handleHostRegistrations = () => {
    navigate(token ? "/dashboard/create-event" : "/login");
  };

  const handleSetupCheckin = () => {
    navigate(token ? "/dashboard/events" : "/login");
  };

  return (

    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-700 text-white">

      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-cyan-300 blur-3xl" />
        <div className="absolute top-24 right-0 h-96 w-96 rounded-full bg-blue-300 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-24 text-center">

        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-white/10 text-sm"
        >
          <Sparkles size={15} />
          Built for high-volume registrations and on-ground check-ins
        </MotionDiv>

        <MotionH1

          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}

          className="mt-6 text-4xl md:text-6xl font-bold leading-tight tracking-tight"

        >

          Launch Events.
          {/* Host Events. */}

          <br />

          Capture Registrations.
          {/* Register Attendees. */}

          <br />

          Check In Without Chaos.
          {/* Scan Seamlessly. */}

        </MotionH1>

        <MotionP

          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}

          className="mt-6 text-base md:text-lg text-blue-100 max-w-3xl mx-auto"

        >

          GetEvents is your all-in-one organizer cockpit for registrations, passes,
          QR check-ins and mailing workflows from a single dashboard.

        </MotionP>

        {/* Action Buttons */}

        <div className="mt-10 flex justify-center gap-4 flex-wrap">

          <button
            onClick={handleHostRegistrations}
            className="bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:scale-[1.02] transition"
          >

            Host Registrations

            <ArrowRight size={18} />

          </button>

          <button
            onClick={handleSetupCheckin}
            className="border border-white/60 bg-white/10 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition"
          >

            Setup Check-in

          </button>

        </div>

        {/* Feature Chips */}

        <div className="mt-12 flex justify-center flex-wrap gap-3">

          {[
            "Host Registrations",
            "Upload Excel",
            "QR Check-in",
            "Send Certificates"

          ].map((chip) => (

            <span

              key={chip}

              className="border border-white/20 bg-white/60 text-blue-900 px-4 py-2 rounded-full text-sm font-medium"

            >

              {chip}

            </span>

          ))}

        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="rounded-xl bg-white/10 border border-white/20 p-4">
            <ShieldCheck size={18} className="mb-2" />
            <p className="font-semibold">Role-aware control</p>
            <p className="text-sm text-blue-100">Admin, organizer, and volunteer flows from one workspace.</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4">
            <ScanLine size={18} className="mb-2" />
            <p className="font-semibold">Fast check-in ops</p>
            <p className="text-sm text-blue-100">Prepare attendee data and run QR/manual check-in at scale.</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4">
            <Sparkles size={18} className="mb-2" />
            <p className="font-semibold">Sharable registration</p>
            <p className="text-sm text-blue-100">Publish forms and share links for public or private onboarding.</p>
          </div>
        </div>

      </div>

    </section>

  );

}

export default Hero;