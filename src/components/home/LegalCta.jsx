import Button from '../ui/Button';
import assets from '../../assets/assets';
import styles from './LegalCta.module.css';

export default function LegalCta() {
  return (
    <section className={styles.section}
      style={{ backgroundImage: `linear-gradient(rgba(12,9,7,.85), rgba(12,9,7,.9))` }}>
      <div className="container">
        <p className={styles.eyebrow}>Vă stăm alături la fiecare pas</p>
        <h2 className={styles.title}>Documente și informații legale</h2>
        <p className={styles.text}>Pentru îndrumare privind actele obligatorii și procedurile legale, am pregătit o pagină dedicată. Aici găsiți tot ce aveți nevoie pentru a parcurge formalitățile cu ușurință și claritate, în timp ce onorați memoria persoanei dragi.</p>
        <Button to="/informatii-si-acte" variant="primary">Documente și informații</Button>
      </div>
    </section>
  );
}