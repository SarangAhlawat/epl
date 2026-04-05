import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function Hero() {

  return (

    <section className="bg-gradient-to-r from-blue-900 to-blue-600 text-white">

      <div className="max-w-7xl mx-auto px-6 py-24 text-center">

        <motion.h1

          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}

          className="text-5xl font-bold leading-tight"

        >

          Host Events.

          <br />

          Register Attendees.

          <br />

          Scan Seamlessly.

        </motion.h1>

        <motion.p

          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}

          className="mt-6 text-lg text-blue-100"

        >

          One platform to manage registrations,

          QR passes and check-ins.

        </motion.p>

        {/* Action Buttons */}

        <div className="mt-10 flex justify-center gap-4 flex-wrap">

          <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2">

            Host Registrations

            <ArrowRight size={18} />

          </button>

          <button className="border border-white px-6 py-3 rounded-lg font-semibold">

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

              className="bg-white text-blue-700 px-4 py-2 rounded-full text-sm font-medium"

            >

              {chip}

            </span>

          ))}

        </div>

      </div>

    </section>

  );

}

export default Hero;