import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Gallery.module.css';

export default function Gallery({ images = [], alt = 'Imagine' }) {
  const [index, setIndex] = useState(null);
  const open = index !== null;
  const touchX = useRef(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, next, prev]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) (dx < 0 ? next() : prev());
    touchX.current = null;
  };

  const Chevron = ({ dir }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );

  return (
    <>
      <div className={styles.grid}>
        {images.map((src, i) => (
          <button key={i} type="button" className={styles.thumb}
            onClick={() => setIndex(i)} aria-label={`Deschide imaginea ${i + 1}`}>
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {open && (
        <div className={styles.lightbox} role="dialog" aria-modal="true"
          aria-label="Galerie foto" onClick={close}>
          <button type="button" className={styles.close} onClick={close} aria-label="Închide">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          {images.length > 1 && (
            <button type="button" className={`${styles.nav} ${styles.prev}`}
              onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Imaginea anterioară">
              <Chevron dir="left" />
            </button>
          )}

          <figure className={styles.stage} onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <img key={index} src={images[index]} alt={`${alt} ${index + 1}`} className={styles.full} />
            <figcaption className={styles.counter}>{index + 1} / {images.length}</figcaption>
          </figure>

          {images.length > 1 && (
            <button type="button" className={`${styles.nav} ${styles.next}`}
              onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Imaginea următoare">
              <Chevron dir="right" />
            </button>
          )}
        </div>
      )}
    </>
  );
}