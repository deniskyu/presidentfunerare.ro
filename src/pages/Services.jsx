import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import Gallery from '../components/ui/Gallery';
import CallButton from '../components/ui/CallButton';
import assets from '../assets/assets';
import styles from './ServicePage.module.css';

const gallery = Array.from({ length: 4 }, (_, i) => assets[`sf${i + 1}`]);
const items = [
  { t: 'Consiliere gratuită', d: 'Organizăm complet ceremonia, alături de dumneavoastră pe tot parcursul.' },
  { t: 'Pregătirea decedatului', d: 'Îmbălsămare, cosmetică mortuară, îmbrăcare și așezare în sicriu.' },
  { t: 'Menținere la rece', d: 'Păstrarea persoanei decedate la temperaturi joase, până la înmormântare.' },
  { t: 'Transport funerar', d: 'Limuzine moderne Mercedes-Benz, către biserică și cimitir.' },
  { t: 'Sicrie și accesorii', d: 'Gamă variată de modele, complet echipate, pentru orice buget.' },
  { t: 'Coroane și aranjamente', d: 'Aranjamente florale, coroane și jerbe pentru ceremonie.' },
  { t: 'Capelă și priveghi', d: 'Sprijin pentru organizarea priveghiului și a slujbei religioase.' },
  { t: 'Restaurant și catering', d: 'Pomeni în restaurant sau la domiciliu, cu logistică completă.' },
];

export default function Services() {
  return (
    <>
      <Seo title="Servicii Funerare Complete în Craiova | President"
        description="Organizăm înmormântări complete în Craiova și Dolj: acte, sicrie, capelă, transport și pomeni. Consultanți disponibili non-stop, iar consilierea este gratuită."
        path="/servicii" />
      <section className={styles.intro}>
        <div className="container">
          <SectionHeading eyebrow="Tot ce aveți nevoie, într-un singur loc" title="Servicii funerare complete" />
          <div className={styles.text}>
            <p>Înțelegem gravitatea situației prin care treceți, de aceea vă puteți baza pe consultanții experimentați ai <strong>President</strong>, care vă vor fi alături pe toată durata realizării înmormântării și a pomenirilor ce vor urma. Ne deplasăm la dumneavoastră în cel mai scurt timp, la orice adresă din județul Dolj — indiferent dacă decesul survine la domiciliu sau în spital. Consilierea este gratuită.</p>
          </div>
          <div className={styles.grid}>
            {items.map((i) => (
              <div key={i.t} className={styles.card}>
                <h3 className={styles.cardTitle}>{i.t}</h3>
                <p className={styles.cardText}>{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.gallerySection}>
        <div className="container">
          <SectionHeading eyebrow="Din activitatea noastră" title="Galerie" />
          <div className={styles.galleryWrap}><Gallery images={gallery} alt="Servicii funerare President" /></div>
          <div className={styles.cta}><CallButton variant="solid" /></div>
        </div>
      </section>
    </>
  );
}