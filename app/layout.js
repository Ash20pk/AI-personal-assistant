import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Jarvis.ai Assistant',
  description: 'Your personal AI assistant powered by advanced voice recognition',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black min-h-screen flex flex-col relative`}>
        <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="scanline fixed inset-0 pointer-events-none" />
        <Navbar />
        <main className="flex-grow pt-16 relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
