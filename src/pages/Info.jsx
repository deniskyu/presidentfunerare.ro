import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import CallButton from '../components/ui/CallButton';
import styles from './Info.module.css';

const docsDeces = [
  'Certificatul medical constatator al decesului',
  'Actul de identitate al persoanei decedate (se reține la instituție)',
  'Certificatul de naștere al persoanei decedate',
  'Livretul militar (pentru persoanele sub 60 de ani) sau o declarație că nu există',
  'Dovada eliberată de Parchet (în caz de sinucidere, accident, moarte violentă sau depășirea termenului de 3 zile)',
];
const docsAjutor = [
  'Cerere tip privind solicitarea ajutorului de deces',
  'Certificatul de deces (original + copie)',
  'Actul de identitate al solicitantului',
  'Certificatul de naștere, de căsătorie și alte acte din care rezultă gradul de rudenie',
  'Facturi și chitanțe pentru cheltuielile de înmormântare (obligatoriu factura pentru sicriu)',
];

export default function Info() {
  return (
    <>
      <Seo title="Acte Necesare la Deces – Informații | President Craiova"
        description="Ghid complet cu actele necesare în caz de deces și pașii legali de urmat în Craiova și Dolj. Vă îndrumăm cu claritate în cele mai grele momente."
        path="/informatii-si-acte" />
      <section className={styles.section}>
        <div className="container">
          <SectionHeading eyebrow="Vă îndrumăm la fiecare pas" title="Informații și acte" />
          <p className={styles.lead}>Aici găsiți tot ce aveți nevoie pentru a parcurge procedurile legale cu ușurință. Vă putem ajuta cu obținerea tuturor documentelor — nu trebuie să le gestionați singuri.</p>

          <div className={styles.blocks}>
            <article className={styles.block}>
              <h2 className={styles.blockTitle}>Certificatul de deces și adeverința de înhumare</h2>
              <p>Se obțin de la SPCLEP sau de la Primăria pe raza căreia a avut loc decesul, în termen de 2–3 ore, pe baza unui dosar care trebuie să conțină:</p>
              <ul className={styles.docs}>{docsDeces.map((d) => <li key={d}>{d}</li>)}</ul>
              <p className={styles.note}>Adeverința de înhumare se înmânează preotului ori crematoriului pentru realizarea serviciului. Pentru persoanele decedate în străinătate, certificatul de deces se traduce în limba română, iar adeverința de înhumare se eliberează de Primăria pe raza căreia se va efectua înhumarea.</p>
            </article>

            <article className={styles.block}>
              <h2 className={styles.blockTitle}>Îmbălsămarea și pregătirea decedatului</h2>
              <p>În cazul decesului la domiciliu, al doilea pas este îmbălsămarea — realizată tot prin firma de servicii funerare — care previne degradarea accelerată a corpului. Medicul specializat eliberează certificatul de îmbălsămare, necesar pentru transportul către cimitir sau capelă. Urmează apoi cosmetica mortuară, îmbrăcarea și așezarea în sicriu.</p>
            </article>

            <article className={styles.block}>
              <h2 className={styles.blockTitle}>Acte necesare pentru ajutorul de deces</h2>
              <p>Pentru dosarul depus la Casa de Pensii sunt necesare:</p>
              <ul className={styles.docs}>{docsAjutor.map((d) => <li key={d}>{d}</li>)}</ul>
            </article>
          </div>

          <div className={styles.cta}>
            <p className={styles.ctaText}>Aveți întrebări despre acte? Sunați-ne — vă ghidăm pas cu pas.</p>
            <CallButton variant="solid" />
          </div>
        </div>
      </section>
    </>
  );
}