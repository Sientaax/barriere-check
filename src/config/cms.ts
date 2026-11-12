/** Adresse des CMS-Workers (beim Build über die Umgebungsvariable VITE_CMS_API gesetzt). */
export const CMS_API: string = (import.meta.env.VITE_CMS_API ?? '').replace(/\/+$/, '')
