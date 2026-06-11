import assets from '../../assets/assets';
import SectionHeading from '../ui/SectionHeading';
import styles from './IntroComplete.module.css';

export default function IntroComplete() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="Cu ce vă putem ajuta?" title="Servicii funerare complete" />
        <div className={styles.grid}>
          <div className={styles.text}>
            <p>Clipa trecerii în neființă a unei persoane dragi este și va fi mereu un moment dureros pentru cei ce rămân în urmă, un moment în care vor avea cea mai mare nevoie de sprijin și suport moral. Experiența și tradiția ne-au învățat să fim întotdeauna atenți la detalii, îndreptându-ne mereu spre a îndeplini doleanțele specifice fiecărei familii.</p>
            <p>Înțelegem gravitatea situației prin care treceți, de aceea vă puteți baza pe consultanții experimentați ai <strong>President</strong>, care vor fi alături de dumneavoastră pe toată durata realizării înmormântării și a pomenirilor ce vor urma. Consilierea este gratuită.</p>
            <p>Tratăm fiecare familie cu respect și compasiune și personalizăm serviciile în funcție de nevoile dumneavoastră, cu o gamă diversificată de produse, adaptate fiecărui buget.</p>
          </div>
          <div className={styles.media}>
            <img className={styles.imgBack} src={assets.main5} alt="Servicii funerare President" loading="lazy" />
            <img className={styles.imgFront} src={assets.main6} alt="Aranjament floral funerar" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}