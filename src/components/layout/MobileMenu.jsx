import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { site } from '../../data/site';
import assets from '../../assets/assets';
import CallButton from '../ui/CallButton';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Meniu">
        <div className={styles.head}>
          <img src={assets.logo} alt="President Servicii Funerare" className={styles.logo} />
          <button type="button" className={styles.close} onClick={onClose} aria-label="Închide meniul">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className={styles.nav}>
          {site.nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.foot}>
          <CallButton variant="solid" />
        </div>
      </aside>
    </div>
  );
}