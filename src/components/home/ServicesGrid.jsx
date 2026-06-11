import { Link } from 'react-router-dom';
import assets from '../../assets/assets';
import SectionHeading from '../ui/SectionHeading';
import styles from './ServicesGrid.module.css';

const services = [
  { title: 'Servicii funerare complete', img: assets.main7, to: '/servicii' },
  { title: 'Transport funerar', img: assets.main8, to: '/transport-funerar' },
  { title: 'Restaurant sau serviciu catering', img: assets.main9, to: '/restaurant-funerare' },
  { title: 'Sicrie', img: assets.main10, to: '/sicrie' },
];

export default function ServicesGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="Un ajutor discret în cele mai grele momente" title="Serviciile noastre" />
        <div className={styles.grid}>
          {services.map((s) => (
            <Link key={s.to} to={s.to} className={styles.card}>
              <div className={styles.imgWrap}>
                <img src={s.img} alt={s.title} loading="lazy" />
              </div>
              <div className={styles.label}>
                <span>{s.title}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}