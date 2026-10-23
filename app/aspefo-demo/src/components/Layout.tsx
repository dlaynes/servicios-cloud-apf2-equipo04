import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { motion } from 'motion/react';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
