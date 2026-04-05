import MainLayout from "../layouts/MainLayout";

import Hero from "../components/Hero";
import About from "../components/About";
import PublicEvents from "../components/PublicEvents";

function Landing() {

  return (

    <MainLayout>

      <Hero />

      <About />

      <PublicEvents />

    </MainLayout>

  );

}

export default Landing;