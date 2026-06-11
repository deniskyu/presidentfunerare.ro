import Seo from '../../components/seo/Seo';
import styles from './LegalLayout.module.css';

export default function LegalLayout({ title, description, path, eyebrow = 'Informații legale', children }) {
  return (
    <>
      <Seo title={`${title} | President Funerare`} description={description} path={path} />
      <section className={styles.section}>
        <div className="container">
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.prose}>{children}</div>
        </div>
      </section>
    </>
  );
}