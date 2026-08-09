import '../styles/globals.css';
import Navigation from '../components/Navigation';

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="p-6 max-w-4xl mx-auto">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;