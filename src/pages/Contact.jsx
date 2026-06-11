import { useState } from 'react';
import Seo from '../components/seo/Seo';
import SectionHeading from '../components/ui/SectionHeading';
import { site } from '../data/site';
import styles from './Contact.module.css';

const Icon = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Pin = () => <Icon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></Icon>;

export default function Contact() {
  const [status, setStatus] = useState('idle');

  const onSubmit = (e) => {
    e.preventDefault();
    
    // 1. Extragem datele completate de utilizator în formular
    const formData = new FormData(e.target);
    const nume = formData.get('nume');
    const telefon = formData.get('telefon');
    const email = formData.get('email') || 'Nespecificat';
    const mesaj = formData.get('mesaj');

    // 2. Numărul tău de telefon în format internațional (fără + sau spații)
    // Va trimite mesajul direct către numărul din site.phone (0784 005 555 -> 40784005555)
    const numarWhatsApp = '40784005555'; 

    // 3. Aranjăm textul mesajului să arate curat și ordonat pe WhatsApp
    const textMesaj = encodeURIComponent(
      `Bună ziua, am trimis un mesaj de pe site-ul President Funerare:\n\n` +
      `👤 *Nume:* ${nume}\n` +
      `📞 *Telefon:* ${telefon}\n` +
      `✉️ *E-mail:* ${email}\n\n` +
      `💬 *Mesaj:* ${mesaj}`
    );

    // 4. Deschidem automat WhatsApp într-o filă nouă cu mesajul gata scris
    window.open(`https://wa.me/${numarWhatsApp}?text=${textMesaj}`, '_blank');
    
    // 5. Resetăm formularul și arătăm mesajul de succes pe ecran
    setStatus('ok');
    e.target.reset();
  };

  return (
    <>
      <Seo title="Contact President Funerare Craiova – Non-stop 24/7"
        description="Contactați President Servicii Funerare Craiova non-stop, 24/7. Telefon 0784 005 555. Ne deplasăm rapid la orice adresă din județul Dolj."
        path="/contacteaza-ne" />

      <section className={styles.section}>
        <div className="container">
          <SectionHeading eyebrow="Suntem aici non-stop" title="Contactează-ne" />
          <p className={styles.lead}>Ne puteți suna la orice oră — consultanții noștri sunt mereu disponibili să vă ajute cu informații și sprijin.</p>

          <div className={styles.grid}>
            <div className={styles.info}>
              <a className={styles.card} href={`tel:${site.phone.replace(/[\s.]/g, '')}`}>
                <span className={styles.cardIcon}><Icon><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></Icon></span>
                <span><span className={styles.cardLabel}>Telefon non-stop</span><span className={styles.cardValue}>{site.phone}</span></span>
              </a>
              <a className={styles.card} href={`mailto:${site.email}`}>
                <span className={styles.cardIcon}><Icon><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Icon></span>
                <span><span className={styles.cardLabel}>E-mail</span><span className={styles.cardValue}>{site.email}</span></span>
              </a>
              <div className={styles.card}>
                <span className={styles.cardIcon}><Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon></span>
                <span><span className={styles.cardLabel}>Program</span><span className={styles.cardValue}>Non-stop · 24/7</span></span>
              </div>
              <a className={styles.card} href="https://maps.google.com/?q=B-dul+Oltenia+87,+Craiova" target="_blank" rel="noopener noreferrer">
                <span className={styles.cardIcon}><Pin /></span>
                <span><span className={styles.cardLabel}>Sediu</span><span className={styles.cardValue}>B-dul Oltenia nr. 87, Craiova (Craiovița, zona Fortuna)</span></span>
              </a>
              <a className={styles.card} href="https://maps.google.com/?q=Strada+Amaradia+21-23,+Craiova" target="_blank" rel="noopener noreferrer">
                <span className={styles.cardIcon}><Pin /></span>
                <span><span className={styles.cardLabel}>Restaurant</span><span className={styles.cardValue}>Str. Amaradia nr. 21-23, Craiova</span></span>
              </a>
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <h3 className={styles.formTitle}>Trimiteți-ne un mesaj</h3>
              <div className={styles.row}>
                <input name="nume" required placeholder="Nume" className={styles.input} />
                <input name="telefon" required placeholder="Telefon" className={styles.input} />
              </div>
              <input type="email" name="email" placeholder="E-mail (opțional)" className={styles.input} />
              <textarea name="mesaj" required rows="5" placeholder="Mesajul dumneavoastră" className={styles.input} />
              
              <button type="submit" className={styles.submit}>
                Trimite pe WhatsApp
              </button>
              
              {status === 'ok' && <p className={styles.ok}>Conversația a fost deschisă pe WhatsApp. Vă mulțumim!</p>}
            </form>
          </div>

          <div className={styles.map}>
              <iframe 
                title="Sediu President Funerare — Craiova"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2853.513575971485!2d23.76935797669463!3d44.33771050739958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4752d9c52a70def3%3A0x503e05c06d728ca0!2sBulevardul%20Oltenia%2087%2C%20Craiova!5e0!3m2!1sro!2sro!4v1710000000000!5m2!1sro!2sro"
                style={{ border: 0 }}
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade" 
              />
          </div>
        </div>
      </section>
    </>
  );
}