import { useState } from 'react';
import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import styles from './Faq.module.css';

const faqs = [
  { q: 'Cum procedăm în cazul unui deces?', a: 'În cazul decesului la domiciliu, primul pas este chemarea medicului de familie sau a serviciului de ambulanță pentru constatarea decesului. Apoi ne puteți contacta non-stop, iar noi ne ocupăm de toți pașii care urmează. Dacă decesul survine în spital, suntem de asemenea alături de dumneavoastră.' },
  { q: 'Ce este ajutorul de deces și cât este?', a: 'Ajutorul de deces este sprijinul financiar acordat de statul român prin Casa de Pensii, conform Legii pensiilor 263/2010. Cuantumul se stabilește anual prin legea bugetului asigurărilor sociale de stat și nu poate fi mai mic decât salariul mediu brut. Vă putem comunica suma actualizată la momentul solicitării.' },
  { q: 'Cine poate beneficia de ajutorul de deces?', a: 'Ajutorul se acordă persoanelor cu calitatea de asigurat sau pensionar, ori unui membru de familie (soț/soție, copil propriu sau adoptat etc.) care nu are calitatea de asigurat sau pensionar.' },
  { q: 'Ce documente sunt necesare pentru ajutorul de deces?', a: 'Sunt necesare documente din care să rezulte suportarea cheltuielilor de înmormântare — cel mai frecvent factura și chitanța/bonul pentru sicriu, eliberate de firma de servicii funerare — alături de certificatul de deces și actele de identitate.' },
  { q: 'Ce este îmbălsămarea și de ce este necesară?', a: 'Îmbălsămarea previne degradarea accelerată a corpului până la înmormântare. Se realizează de către un medic specializat, care eliberează și certificatul de îmbălsămare necesar pentru transportul către cimitir sau capelă.' },
  { q: 'Ce presupune pregătirea decedatului?', a: 'După îmbălsămare se trece la cosmetica mortuară (machiaj, bărbierit), îmbrăcarea și așezarea în sicriu — servicii efectuate de angajații noștri, cu respect și grijă față de persoana decedată.' },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <Seo title="Întrebări Frecvente Servicii Funerare | President"
        description="Răspunsuri la cele mai frecvente întrebări despre servicii funerare, acte, costuri și organizare în Craiova și Dolj. Suntem alături de dumneavoastră non-stop."
        path="/intrebari-frecvente" schema={faqSchema} />

      <section className={styles.section}>
        <div className="container">
          <SectionHeading eyebrow="Răspunsuri la ce ne întrebați des" title="Întrebări frecvente" />
          <div className={styles.list}>
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
                  <button type="button" className={styles.q} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span>{f.q}</span><span className={styles.plus} aria-hidden="true" />
                  </button>
                  <div className={styles.aWrap}><p className={styles.a}>{f.a}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}