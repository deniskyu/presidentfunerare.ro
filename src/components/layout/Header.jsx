import { NavLink } from 'react-router-dom';
import { site } from '../../data/site';
import assets from '../../assets/assets';
import styles from './Header.module.css';

export default function Header({ onMenuOpen }) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <NavLink to="/" className={styles.logo} aria-label="President Funerare — Acasă">
          <img src={assets.logo} alt="President Servicii Funerare" />
        </NavLink>

        <nav className={styles.nav} aria-label="Meniu principal">
          {site.nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              {item.short || item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className={styles.burger} onClick={onMenuOpen} aria-label="Deschide meniul">
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}