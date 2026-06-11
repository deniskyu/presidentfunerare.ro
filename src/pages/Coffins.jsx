import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import Gallery from '../components/ui/Gallery';
import CallButton from '../components/ui/CallButton';
import assets from '../assets/assets';
import styles from './Coffins.module.css';

const gallery = [assets.s1, assets.s2, assets.s3, assets.s4, assets.s5, assets.s6, assets.s7, assets.s8];
const features = [
  'Lenjerie și lenjerie capac', 'Pernă matlasată', 'Voal', 'Capitonaj capac',
  'Saltea absorbantă', 'Cruce inscripționată', 'Orar mic și mare', 'Mânere și accesorii',
];

export default function Coffins() {
  return (
    <>
      <Seo title="Sicrie Craiova – Modele și Prețuri | President"
        description="Gamă variată de sicrie de calitate în Craiova, pentru orice buget, complet echipate. Vă ajutăm să alegeți modelul potrivit. Disponibili non-stop în Dolj."
        path="/sicrie" />

      <section className={styles.intro}>
        <div className="container">
          <SectionHeading eyebrow="Modele variate, prețuri corecte" title="Sicrie" />
          <div className={styles.text}>
            <p>Oferta noastră conține o gamă variată de modele — de la cele mai simple și accesibile, până la modele de lux din lemn de esență nobilă, cu ornamente suplimentare și accesorii interioare din materiale textile de calitate superioară.</p>
            <p>Toate sicriele sunt <strong>complet echipate</strong>, indiferent de gama din care fac parte, și sunt inspectate cu atenție de experții noștri înainte de a ajunge la dumneavoastră. Le oferim întotdeauna la prețuri corecte.</p>
          </div>
          <ul className={styles.features}>
            {features.map((f) => (
              <li key={f} className={styles.feature}><span className={styles.check} aria-hidden="true">✓</span>{f}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.gallerySection}>
        <div className="container">
          <SectionHeading eyebrow="Câteva dintre modelele noastre" title="Galerie sicrie" />
          <div className={styles.galleryWrap}><Gallery images={gallery} alt="Sicriu President" /></div>
          <div className={styles.cta}><CallButton variant="solid" /></div>
        </div>
      </section>
    </>
  );
}