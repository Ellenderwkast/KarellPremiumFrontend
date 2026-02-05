import '../styles/footer.css';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Sobre nosotros</h4>
            <p>Tu tienda online confiable con los mejores productos y servicio al cliente.</p>
          </div>

          <div className="footer-section">
            <h4>Enlaces rápidos</h4>
            <ul>
              <li>
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <Link to="/products">Productos</Link>
              </li>
              <li>
                <Link to="/cart">Carrito</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Información legal</h4>
            <ul>
              <li>
                <Link to="/terms">Términos de servicio</Link>
              </li>
              <li>
                <Link to="/privacy">Política de privacidad</Link>
              </li>
              <li>
                <a
                  href="https://wa.me/573158164656?text=%C2%A1Hola!%20Estoy%20interesado%20en%20sus%20productos"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Síguenos</h4>
            <div className="social-links">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src="/images/facebook.svg" alt="Facebook" />
                <span className="social-text">Facebook</span>
              </a>
              <a href="https://www.tiktok.com/@karell_premium?_r=1&_t=ZS-91xHhhcl7D7" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src="/images/tiktok.svg" alt="TikTok" />
                <span className="social-text">TikTok</span>
              </a>
              <a
                href="https://www.instagram.com/karell_premium"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <img src="/images/instagram.svg" alt="Instagram" />
                <span className="social-text">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Karell Premium. Todos los derechos reservados.</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            <a href="mailto:contactokarellpremium@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
              <span className="footer-email">
                <Mail className="footer-email-icon" aria-hidden="true" />
                contactokarellpremium@gmail.com
              </span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
