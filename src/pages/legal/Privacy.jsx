import { Link } from 'react-router-dom';
import LegalLayout from './LegalLayout';
import { site } from '../../data/site.js';

export default function Privacy() {
  return (
    <LegalLayout
      title="Prelucrarea datelor cu caracter personal"
      description="Modul în care President Funerare Craiova colectează și prelucrează datele cu caracter personal, conform GDPR."
      path="/prelucrarea-datelor-cu-caracter-personal"
    >
      <p>President acordă o importanță deosebită protecției datelor cu caracter personal. Această politică explică ce date colectăm prin site-ul <strong>presidentfunerare.ro</strong>, în ce scop și care sunt drepturile dumneavoastră, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).</p>

      <h2>1. Operatorul de date</h2>
      <p>Operatorul datelor colectate prin intermediul acestei platforme online este serviciul de asistență clienți al site-ului <strong>presidentfunerare.ro</strong>, localizat în {site.address}. Ne puteți contacta direct la numerele de asistență non-stop {site.phone} / {site.phone2} sau prin e-mail securizat la adresa {site.email}.</p>

      <h2>2. Ce date colectăm</h2>
      <p>Colectăm date cu caracter personal doar atunci când ni le furnizați direct sau când sunt necesare pentru funcționarea Site-ului:</p>
      <ul>
        <li><strong>Date de contact</strong> transmise prin formularul din pagina de contact: nume, adresă de e-mail (opțional), număr de telefon și conținutul mesajului dumneavoastră. Aceste date nu sunt stocate pe serverul nostru, ci sunt trimise direct și securizat în fereastra de chat a aplicației WhatsApp pentru preluare imediată de către un consultant.</li>
        <li><strong>Date tehnice</strong> colectate automat prin cookie-uri (de exemplu, adresa IP, tipul browserului), conform <Link to="/politica-de-cookies">Politicii de cookies</Link>.</li>
      </ul>

      <h2>3. Scopurile și temeiul prelucrării</h2>
      <ul>
        <li>Pentru a prelua de urgență solicitările și a iniția conversația de suport tehnic sau informativ — temei: consimțământul dumneavoastră prin apăsarea butonului de trimitere și măsuri precontractuale.</li>
        <li>Pentru a vă presta serviciile funerare solicitate ulterior — temei: executarea înțelegerii sau a contractului de servicii dintre dumneavoastră și President.</li>
        <li>Pentru îndeplinirea obligațiilor legale (de exemplu, eliberarea actelor de deces, reglementări fiscale sau contabile pentru servicii prestate) — temei: obligația legală.</li>
        <li>Pentru îmbunătățirea și securitatea Site-ului — temei: interesul legitim.</li>
      </ul>

      <h2>4. Cât timp păstrăm datele</h2>
      <p>Deoarece datele din formular sunt transmise direct pe canalul de chat extern ales de utilizator (WhatsApp), platforma noastră web nu păstrează istoricul textelor. Eventualele detalii salvate ulterior în scopul prestării serviciilor vor fi păstrate doar pe perioada necesară îndeplinirii scopurilor legale sau contabile.</p>

      <h2>5. Cui dezvăluim datele</h2>
      <p>Nu vindem, nu închiriem și nu înstrăinăm datele dumneavoastră. Datele introduse în formular sunt prelucrate instantaneu la nivel de browser pentru a deschide API-ul oficial securizat al serviciului WhatsApp. Le putem dezvălui, de asemenea, autorităților publice exclusiv atunci când legea o impune.</p>

      <h2>6. Transferul datelor în afara UE</h2>
      <p>Utilizarea aplicației de chat (WhatsApp) pentru redirecționarea rapidă a formularului sau a hărții Google Maps implică stocarea sau procesarea anumitor date tehnice prin intermediul serverelor furnizorilor acestor servicii globale. Acești operatori dețin protocoale stricte de conformitate și garanții adecvate recunoscute de Uniunea Europeană conform GDPR.</p>

      <h2>7. Drepturile dumneavoastră</h2>
      <p>În calitate de persoană vizată, beneficiați de următoarele drepturi:</p>
      <ul>
        <li>dreptul de acces la datele dumneavoastră;</li>
        <li>dreptul la rectificarea datelor inexacte;</li>
        <li>dreptul la ștergerea datelor („dreptul de a fi uitat");</li>
        <li>dreptul la restricționarea prelucrării;</li>
        <li>dreptul la portabilitatea datelor;</li>
        <li>dreptul de a vă opune prelucrării;</li>
        <li>dreptul de a vă retrage consimțământul în orice moment;</li>
        <li>dreptul de a depune o plângere la autoritatea de supraveghere.</li>
      </ul>
      <p>Pentru exercitarea acestor drepturi ne puteți contacta direct prin e-mail la {site.email}.</p>

      <h2>8. Securitatea datelor</h2>
      <p>Aplicăm măsuri tehnice, conexiuni criptate SSL și măsuri organizatorice pentru a asigura trimiterea în deplină siguranță a datelor direct din browserul dumneavoastră.</p>

      <h2>9. Datele persoanelor decedate</h2>
      <p>Datele persoanelor decedate nu intră sub incidența normelor GDPR. Cu toate acestea, prin specificul activității noastre funerare non-stop, tratăm absolut toate informațiile primite cu maximă confidențialitate, demnitate și respect față de memoria celor trecuți în neființă.</p>

      <h2>10. Autoritatea de supraveghere</h2>
      <p>Dacă apreciați că prelucrarea datelor dumneavoastră încalcă legislația, vă puteți adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), cu sediul în București, sau accesa direct <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>.</p>

      <p><em>Ultima actualizare: iunie 2026.</em></p>
    </LegalLayout>
  );
}