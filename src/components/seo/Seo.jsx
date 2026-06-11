import { Head } from 'vite-react-ssg';

const SITE_URL = 'https://presidentfunerare.ro';
const SITE_NAME = 'President Funerare';
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_TITLE = 'President Funerare – Servicii funerare complete non-stop în Craiova și Dolj';
const DEFAULT_DESC = 'Servicii funerare complete non-stop în Craiova și județul Dolj: înmormântări, transport funerar, sicrie și catering. Consiliere gratuită. Sunați 0784 005 555.';

const business = {
  '@context': 'https://schema.org',
  '@type': 'FuneralHome',
  '@id': `${SITE_URL}/#business`,
  name: 'President Servicii Funerare',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: OG_IMAGE,
  description: DEFAULT_DESC,
  telephone: '+40784005555',
  email: 'contact@presidentfunerare.ro',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bulevardul Oltenia 87',
    addressLocality: 'Craiova',
    addressRegion: 'Dolj',
    addressCountry: 'RO',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 44.3326642, longitude: 23.7789353 },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
  areaServed: ['Craiova', 'Județul Dolj'],
  sameAs: ['https://www.facebook.com/profile.php?id=100083071314034'],
};

export default function Seo({ title, description, path = '', image, schema }) {
  const fullTitle = title || DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const url = `${SITE_URL}${path}`;
  const ogImage = image || OG_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ro_RO" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">{JSON.stringify(business)}</script>
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
    </Head>
  );
}