import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import Gallery from '../components/ui/Gallery';
import CallButton from '../components/ui/CallButton';
import assets from '../assets/assets';
import styles from './ServicePage.module.css';

const gallery = Array.from({ length: 21 }, (_, i) => assets[`tf${i + 1}`]);
const items = [
  { t: 'Intern și internațional', d: 'Transport funerar oriunde în țară și în străinătate.' },
  { t: 'Limuzine Mercedes-Benz', d: 'Mașini moderne, dotate cu aer condiționat.' },
  { t: 'Omologate și conforme', d: 'Respectă standardele UE și normele sanitare în vigoare.' },
  { t: 'Transport participanți', d: 'Microbuze pentru participanții la ceremonia funerară.' },
  { t: 'Coroane și aranjamente', d: 'Transportăm coroanele, jerbele și aranjamentele florale.' },
  { t: 'De la spital la ceremonie', d: 'Preluare de la spital sau domiciliu, până la biserică și cimitir.' },
];

export default function Transport() {
  return (
    <>
      <Seo title="Transport Funerar Craiova și Dolj, Non-stop | President"
        description="Transport funerar autorizat în Craiova, Dolj și în țară, cu limuzine moderne Mercedes. Ne deplasăm non-stop, la orice adresă, în cel mai scurt timp."
        path="/transport-funerar" />
      <section className={styles.intro}>
        <div className="container">
          <SectionHeading eyebrow="Rapid, sigur, conform normelor UE" title="Transport funerar" />
          <div className={styles.text}>
            <p>Suntem una dintre firmele funerare din Craiova care oferă atât transport funerar intern, cât și internațional. Adaptat standardelor Uniunii Europene, transportul se face cu limuzine moderne marca <strong>Mercedes-Benz</strong>, dotate cu aer condiționat, omologate și conforme cu normele sanitare în vigoare.</p>
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
          <SectionHeading eyebrow="Parcul nostru auto" title="Galerie transport" />
          <div className={styles.galleryWrap}><Gallery images={gallery} alt="Transport funerar President" /></div>
          <div className={styles.cta}><CallButton variant="solid" /></div>
        </div>
      </section>
    </>
  );
}