// Texto SEO movido desde Home.jsx para el blog
export const blogIntroSEO = {
	title: 'Audífonos inalámbricos y accesorios tecnológicos en Colombia',
	description: 'Descubre la mejor tienda online de audífonos diadema, Bluetooth y accesorios premium. Calidad, garantía y envío rápido a todo el país. ¡Compra hoy y recibe en casa!'
};
import { lazy } from 'react';

export const BlogList = lazy(() => import('./Blog/BlogList'));
export const BlogPost = lazy(() => import('./Blog/BlogPost'));
