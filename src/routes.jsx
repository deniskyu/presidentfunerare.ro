import Layout from './components/layout/Layout';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Coffins from './pages/Coffins';
import Restaurant from './pages/Restaurant';
import Transport from './pages/Transport';
import Info from './pages/Info';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Terms from './pages/legal/Terms';
import Cookies from './pages/legal/Cookies';
import Privacy from './pages/legal/Privacy';

import { Navigate } from 'react-router-dom';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'despre-noi', element: <About /> },
      { path: 'servicii', element: <Services /> },
      { path: 'sicrie', element: <Coffins /> },
      { path: 'restaurant-funerare', element: <Restaurant /> },
      { path: 'transport-funerar', element: <Transport /> },
      { path: 'informatii-si-acte', element: <Info /> },
      { path: 'intrebari-frecvente', element: <Faq /> },
      { path: 'contacteaza-ne', element: <Contact /> },
      { path: 'termeni-si-conditii', element: <Terms /> },
      { path: 'politica-de-cookies', element: <Cookies /> },
      { path: 'prelucrarea-datelor-cu-caracter-personal', element: <Privacy /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];