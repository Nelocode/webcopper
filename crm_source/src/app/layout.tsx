import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Outcrop Silver CRM System',
  description: 'Sistema CRM para la industria minera con taxonomía de inversionistas, vista 360°, escáner de tarjetas 2 caras, notas de voz, grafo de relaciones e integración con WhatsApp Baileys.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#141523] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
