import { NavLink } from 'react-router-dom';
import { site } from '../../data/site';
import assets from '../../assets/assets';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}
      style={{ backgroundImage: `linear-gradient(rgba(15,12,9,.93), rgba(15,12,9,.97)), url(${assets.footerImage})` }}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <img src={assets.logo} alt="President Servicii Funerare" className={styles.logo} />
          <p className={styles.tagline}>Servicii funerare complete, non-stop, în Craiova și tot județul Dolj.</p>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>Meniu</h3>
          <ul>
            {site.nav.map((i) => (
              <li key={i.to}><NavLink to={i.to} end={i.to === '/'} className={styles.flink}>{i.label}</NavLink></li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>Link-uri utile</h3>
          <ul>
            {site.legalLinks.map((i) => (
              <li key={i.to}><NavLink to={i.to} className={styles.flink}>{i.label}</NavLink></li>
            ))}
          </ul>
          <div className={styles.badges}>
            <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer"><img src={assets.anpcimg} alt="ANPC – SAL" /></a>
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"><img src={assets.solImg} alt="SOL" /></a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">© {year} President Funerare. Toate drepturile rezervate.</div>
      </div>
    </footer>
  );
}