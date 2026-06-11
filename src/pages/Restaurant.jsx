import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import Gallery from '../components/ui/Gallery';
import CallButton from '../components/ui/CallButton';
import assets from '../assets/assets';
import styles from './ServicePage.module.css';

const gallery = Array.from({ length: 37 }, (_, i) => assets[`r${i + 1}`]);
const items = [
  { t: '4 săli, 170 de locuri', d: 'Spații generoase pentru pomeni și alte evenimente.' },
  { t: 'În restaurant sau la domiciliu', d: 'Servicii de catering oriunde aveți nevoie.' },
  { t: 'Meniu personalizabil', d: 'Plecând de la propunerile noastre sau de la ideile dumneavoastră.' },
  { t: 'Logistică completă', d: 'Transport, mese, scaune, veselă, fețe de masă, șervețele.' },
  { t: 'Echipă dedicată', d: 'Coordonator de eveniment, bucătari și ospătari.' },
  { t: 'Locație centrală', d: 'Str. Amaradia nr. 21-23, într-o zonă liniștită din Craiova.' },
];

export default function Restaurant() {
  return (
    <>
      <Seo title="Catering & Pomeni Craiova | President Funerare"
        description="Servicii de catering și restaurant pentru pomeni și parastase în Craiova și Dolj. Patru săli, 170 de locuri, meniuri personalizabile și organizare completă."
        path="/restaurant-funerare" />
      <section className={styles.intro}>
        <div className="container">
          <SectionHeading eyebrow="Pomeni și catering, fără griji" title="Restaurant President" />
          <div className={styles.text}>
            <p>Asigurăm pomeni atât în incinta restaurantului, cât și la locația clientului, sub formă de servicii de catering. Restaurantul President este împărțit în <strong>patru săli</strong>, cu un total de 170 de locuri, și este amplasat pe Strada Amaradia nr. 21-23, într-o zonă liniștită și centrală a orașului Craiova.</p>
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
          <SectionHeading eyebrow="Sălile și preparatele noastre" title="Galerie restaurant" />
          <div className={styles.galleryWrap}><Gallery images={gallery} alt="Restaurant President" /></div>
          <div className={styles.cta}><CallButton variant="solid" /></div>
        </div>
      </section>
    </>
  );
}