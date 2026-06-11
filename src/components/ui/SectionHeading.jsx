import styles from './SectionHeading.module.css';

export default function SectionHeading({ eyebrow, title, light = false }) {
  return (
    <div className={`${styles.heading} ${light ? styles.light : ''}`}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 className={styles.title}>{title}</h2>
      <span className={styles.ornament} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.diamond} />
        <span className={styles.line} />
      </span>
    </div>
  );
}