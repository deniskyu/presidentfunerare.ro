import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';

// Fonturi self-hosted
import '@fontsource/cormorant/400.css';
import '@fontsource/cormorant/500.css';
import '@fontsource/cormorant/600.css';
import '@fontsource/cormorant/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

// Stiluri globale
import './styles/globals.css';

export const createRoot = ViteReactSSG({ routes });