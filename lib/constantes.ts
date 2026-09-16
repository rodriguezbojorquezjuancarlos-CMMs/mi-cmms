// Constantes compartidas del negocio. Por ahora solo tienes UNA
// empresa real (JBI) — cuando el sistema soporte más de una empresa
// de verdad (no solo sucursales dentro de la misma), esto deja de
// tener sentido y hay que resolverlo distinto (ej. por sesión/rol).
//
// Se usa en vez de "select id from empresas limit 1" — ese patrón fue
// exactamente lo que causó que varias órdenes de trabajo quedaran
// ancladas a una empresa placeholder, y se borraran en cascada cuando
// limpiamos esa empresa placeholder.
export const EMPRESA_ID_JBI = '0a53ef2c-d910-4b55-8884-cc986346be11'