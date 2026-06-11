import { site } from '../../data/site';
import assets from '../../assets/assets';
import styles from './ContactBanner.module.css';

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function ContactBanner() {
  return (
    <section className={styles.banner}
      style={{ backgroundImage: `linear-gradient(rgba(12,9,7,.82), rgba(12,9,7,.9)), url(${assets.main1})` }}>
      <div className="container">
        <p className={styles.eyebrow}>President Funerare Craiova</p>
        <h2 className={styles.title}>Disponibili 24 de ore pe zi, 7 zile pe săptămână</h2>
        <p className={styles.sub}>Ne deplasăm la dumneavoastră în cel mai scurt timp, la orice adresă din județul Dolj.</p>
        <div className={styles.phones}>
          <a className={styles.phone} href={`tel:${site.phone.replace(/[\s.]/g, '')}`}><span className={styles.icon}><PhoneIcon /></span>{site.phone}</a>
          <a className={styles.phone} href={`tel:${site.phone2.replace(/[\s.]/g, '')}`}><span className={styles.icon}><PhoneIcon /></span>{site.phone2}</a>
        </div>
      </div>
    </section>
  );
}