import Seo from '../components/seo/Seo';
import Hero from '../components/home/Hero';
import IntroComplete from '../components/home/IntroComplete';
import ServicesGrid from '../components/home/ServicesGrid';
import ContactBanner from '../components/home/ContactBanner';
import Values from '../components/home/Values';
import LegalCta from '../components/home/LegalCta';

export default function Home() {
  return (
    <>
      <Seo
        title="Servicii Funerare Craiova – Non-stop în Dolj | President"
        description="Servicii funerare complete non-stop în Craiova și județul Dolj: înmormântări, transport funerar, sicrie, catering. Consiliere gratuită. Sunați 0784 005 555."
        path="/"
      />
      <Hero />
      <IntroComplete />
      <ServicesGrid />
      <ContactBanner />
      <Values />
      <LegalCta />
    </>
  );
}