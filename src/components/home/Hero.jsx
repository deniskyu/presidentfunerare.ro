import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import assets from '../../assets/assets';
import styles from './Hero.module.css';

const slides = [assets.main1, assets.main2, assets.main3, assets.main4];
const PHONE = '+40 784 005 555';

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={styles.hero} aria-label="President Funerare">
      <div className={styles.slides} aria-hidden="true">
        {slides.map((src, i) => (
          <div
            key={i}
            className={`${styles.slide} ${i === active ? styles.slideActive : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.scrim} />
      </div>

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Servicii funerare Craiova</p>
        <h1 className={styles.title}>Un sprijin de nădejde,<br />în clipe de grea încercare</h1>
        <p className={styles.subtitle}>
          Servicii funerare complete, pentru momentele dificile. Echipa noastră este
          întotdeauna pregătită să vă ofere sprijin în organizarea unei ceremonii în
          conformitate cu dorințele și tradițiile dumneavoastră.
        </p>
        <div className={styles.actions}>
          <a className={styles.btnPrimary} href={`tel:${PHONE.replace(/\s/g, '')}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Sună acum · {PHONE}
          </a>
          <Link className={styles.btnGhost} to="/contacteaza-ne">Contactează-ne</Link>
        </div>
      </div>

      <div className={styles.dots}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Imaginea ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}