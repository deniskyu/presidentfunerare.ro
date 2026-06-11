import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import Gallery from '../components/ui/Gallery';
import Button from '../components/ui/Button';
import assets from '../assets/assets';
import styles from './About.module.css';

const gallery = [
  assets.dn1, assets.dn2, assets.dn3, assets.dn4, assets.dn5, assets.dn6, assets.dn7,
  assets.dn8, assets.dn9, assets.dn10, assets.dn11, assets.dn12, assets.dn13,
];

export default function About() {
  return (
    <>
      <Seo title="Despre noi – President Servicii Funerare Craiova"
        description="Cu experiență din 2011, President oferă servicii funerare complete în Craiova și Dolj, cu profesionalism, discreție și respect față de fiecare familie."
        path="/despre-noi" />

      <section className={styles.intro}>
        <div className="container">
          <SectionHeading eyebrow="Cine suntem" title="Despre noi" />
          <div className={styles.text}>
            <p>Servicii Funerare President a luat naștere în anul 2011, din dorința de a fi alături și de a oferi suport persoanelor care trec prin momente grele la trecerea în neființă a celor dragi. Principala noastră grijă este mulțumirea celor care ne solicită serviciile.</p>
            <p>Nimic nu ne aduce mai multă satisfacție decât să știm că am putut ajuta familia îndurerată care apelează la noi. Tratăm fiecare familie cu respect, discreție și compasiune, în cele mai sensibile momente.</p>
            <p>Compania noastră dispune de o echipă numeroasă — consilieri de vânzări, șoferi, consilier juridic, director, șef restaurant, bucătari și ospătari — pregătită să se ocupe de fiecare detaliu al ceremoniei.</p>
          </div>
        </div>
      </section>

      <section className={styles.gallerySection}>
        <div className="container">
          <SectionHeading eyebrow="Momente din activitatea noastră" title="Galerie" />
          <div className={styles.galleryWrap}><Gallery images={gallery} alt="President Funerare" /></div>
          <div className={styles.cta}><Button to="/contacteaza-ne" variant="primary">Contactează-ne</Button></div>
        </div>
      </section>
    </>
  );
}