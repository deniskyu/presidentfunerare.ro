import SectionHeading from '../ui/SectionHeading';
import styles from './Values.module.css';

const Svg = ({ children }) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const values = [
  { title: 'Profesionalism și experiență', text: 'Cu peste 20 de ani de experiență, echipa noastră oferă un serviciu de cea mai înaltă calitate. Ne axăm pe profesionalism și empatie, având grijă ca fiecare detaliu al ceremoniei să fie tratat impecabil.', icon: <Svg><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></Svg> },
  { title: 'Soluții personalizate', text: 'Fiecare familie are nevoi și preferințe unice. Oferim soluții personalizate, pentru a crea un serviciu care reflectă cu adevărat personalitatea și viața celui drag care a plecat.', icon: <Svg><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Svg> },
  { title: 'Transparență și respect', text: 'Ne angajăm să fim transparenți în toate aspectele serviciilor noastre. Fără surprize neplăcute sau costuri ascunse — aveți siguranța unui serviciu de înaltă calitate, fără compromisuri.', icon: <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></Svg> },
  { title: 'Grijă deplină și suport constant', text: 'Vă oferim suport constant și grijă deplină în fiecare etapă a procesului funerar. Echipa noastră este disponibilă 24/7 pentru a vă răspunde la întrebări și a vă oferi sprijin în momentele sensibile.', icon: <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg> },
];

export default function Values() {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="Misiunea noastră e mulțumirea dumneavoastră" title="Valorile noastre" />
        <div className={styles.grid}>
          {values.map((v) => (
            <div key={v.title} className={styles.card}>
              <span className={styles.icon}>{v.icon}</span>
              <h3 className={styles.cardTitle}>{v.title}</h3>
              <p className={styles.cardText}>{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}