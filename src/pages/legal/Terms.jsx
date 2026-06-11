import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';
import { site } from '../../data/site.js';

export default function Terms() {
  return (
    <LegalLayout
      title="Termeni și condiții"
      description="Termenii și condițiile de utilizare a site-ului President Funerare Craiova."
      path="/termeni-si-conditii"
    >
      <p>Acești termeni și condiții reglementează utilizarea site-ului <strong>presidentfunerare.ro</strong> (denumit în continuare „Site-ul"), administrat și deținut de serviciul de asistență digitală al brandului local President, cu datele de contact oficiale {site.phone} / {site.phone2} și prin adresa de e-mail {site.email} (denumit în continuare „President" sau „noi"). Prin accesarea și utilizarea Site-ului, sunteți de acord cu prezenții termeni. Dacă nu sunteți de acord, vă rugăm să nu utilizați Site-ul.</p>

      <h2>1. Scopul Site-ului</h2>
      <p>Site-ul are caracter informativ și prezintă serviciile funerare oferite de President în Craiova și în județul Dolj: organizarea de înmormântări, transport funerar, comercializarea de sicrie și accesorii, servicii de catering și pomeni, precum și îndrumare privind actele necesare. Informațiile publicate au rol orientativ și nu reprezintă o ofertă comercială fermă; pentru detalii și costuri vă rugăm să ne contactați.</p>

      <h2>2. Utilizarea Site-ului</h2>
      <p>Vă angajați să utilizați Site-ul exclusiv în scopuri legale și într-un mod care nu aduce atingere drepturilor altor persoane. Este interzisă utilizarea Site-ului pentru transmiterea de conținut ilegal, ofensator sau care încalcă drepturile de proprietate intelectuală.</p>

      <h2>3. Proprietate intelectuală</h2>
      <p>Întregul conținut al Site-ului — texte, imagini, fotografii, elemente grafice, logo și structură — este proprietatea President sau a partenerilor săi și este protejat de legislația privind drepturile de autor. Reproducerea, distribuirea sau utilizarea conținutului fără acordul scris prealabil al President este interzisă.</p>

      <h2>4. Formularul de contact</h2>
      <p>Site-ul pune la dispoziție un formular de contact prin care ne puteți transmite o solicitare rapidă pe WhatsApp. Datele introduse (nume, adresă de e-mail, număr de telefon și mesaj) sunt utilizate exclusiv pentru a vă răspunde și a vă oferi informațiile cerute. Detalii găsiți în <Link to="/prelucrarea-datelor-cu-caracter-personal">Politica de prelucrare a datelor cu caracter personal</Link>.</p>

      <h2>5. Limitarea răspunderii</h2>
      <p>Depunem toate eforturile pentru ca informațiile de pe Site să fie corecte și actualizate. Cu toate acestea, President nu garantează că informațiile sunt complete sau lipsite de erori și nu își asumă răspunderea pentru deciziile luate exclusiv pe baza conținutului Site-ului. Procedurile legale și actele necesare pot varia; vă recomandăm să ne contactați pentru îndrumare personalizată.</p>

      <h2>6. Linkuri către alte site-uri</h2>
      <p>Site-ul poate conține linkuri către pagini externe (de exemplu, hărți sau pagini de social media). President nu controlează și nu își asumă răspunderea pentru conținutul sau politicile acestor site-uri terțe.</p>

      <h2>7. Modificarea termenilor</h2>
      <p>President își rezervă dreptul de a modifica oricând prezenții termeni și condiții. Versiunea actualizată va fi publicată pe această pagină, iar utilizarea Site-ului ulterior modificărilor reprezintă acceptarea acestora.</p>

      <h2>8. Legislație aplicabilă și soluționarea litigiilor</h2>
      <p>Prezenții termeni sunt guvernați de legislația română. Eventualele litigii vor fi soluționate pe cale amiabilă sau, în caz contrar, de instanțele competente din România. În calitate de consumator, vă puteți adresa Autorității Naționale pentru Protecția Consumatorilor (ANPC, <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer">anpc.ro</a>) sau puteți utiliza platforma europeană de soluționare online a litigiilor (SOL), la <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>

      <h2>9. Contact</h2>
      <p>For orice întrebare legată de acești termeni ne puteți contacta direct la numerele de telefon {site.phone} / {site.phone2} sau prin e-mail la {site.email}.</p>

      <p><em>Ultima actualizare: iunie 2026.</em></p>
    </LegalLayout>
  );
}