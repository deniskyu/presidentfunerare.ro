import { site } from '../../data/site';
import styles from './CallButton.module.css';

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function CallButton({ variant = 'solid', label = 'Sună acum', phone = site.phone }) {
  const tel = `tel:${phone.replace(/[\s.]/g, '')}`;
  return (
    <a href={tel} className={`${styles.call} ${styles[variant] || ''}`} aria-label={`${label} ${phone}`}>
      <span className={styles.icon}><PhoneIcon /></span>
      <span className={styles.text}>
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.number}>{phone}</span>
      </span>
    </a>
  );
}