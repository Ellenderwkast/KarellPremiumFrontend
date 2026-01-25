import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import '../styles/terms.css';

function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <SEO
        title="Términos y Condiciones"
        description="Lee nuestros términos y condiciones de servicio para comprar en Karell Premium. Conoce tus derechos y obligaciones."
      />
      <div className="terms-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>
        <h1>Términos y Condiciones de Servicio</h1>
        <p className="last-update">Última actualización: 28 de noviembre de 2025</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Información General</h2>
          <p>
            Bienvenido a nuestra tienda online de audífonos. Al acceder y realizar compras en nuestro sitio web, aceptas
            cumplir con los siguientes términos y condiciones. Por favor, léelos cuidadosamente antes de realizar
            cualquier compra.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Productos y Disponibilidad</h2>
          <p>
            Ofrecemos una variedad de audífonos de alta calidad. Todos los productos mostrados en nuestro sitio están
            sujetos a disponibilidad. Nos reservamos el derecho de limitar las cantidades de cualquier producto que
            ofrecemos.
          </p>
          <ul>
            <li>Los precios están sujetos a cambios sin previo aviso</li>
            <li>Las imágenes son referenciales y pueden variar ligeramente del producto real</li>
            <li>La disponibilidad de colores está sujeta a stock</li>
            <li>Los productos se entregan en su empaque original sellado</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Precios y Pagos</h2>
          <p>
            Todos los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplique. Aceptamos pagos
            a través de nuestra plataforma de pago segura Wompi.
          </p>
          <ul>
            <li>Los precios pueden cambiar sin previo aviso</li>
            <li>El pago debe completarse al momento de realizar el pedido</li>
            <li>Utilizamos pasarelas de pago seguras y encriptadas</li>
            <li>No almacenamos información de tarjetas de crédito en nuestros servidores</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Envíos y Entregas</h2>
          <p>Realizamos envíos a nivel nacional. Los tiempos de entrega pueden variar según la ubicación.</p>
          <ul>
            <li>El tiempo estimado de entrega es de 3 a 7 días hábiles</li>
            <li>Los costos de envío se calculan según el destino y peso del producto</li>
            <li>Proporcionamos número de seguimiento para todos los envíos</li>
            <li>No nos hacemos responsables por retrasos causados por la empresa de mensajería</li>
            <li>Es responsabilidad del cliente verificar la dirección de entrega</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. Devoluciones y Garantías</h2>
          <p>
            Aceptamos devoluciones dentro de los 30 días posteriores a la recepción del producto, siempre que el
            producto esté en su empaque original y sin usar.
          </p>
          <ul>
            <li>El producto debe estar sin uso y en su empaque original</li>
            <li>Los productos dañados por mal uso no son elegibles para devolución</li>
            <li>Los costos de envío de devolución corren por cuenta del cliente</li>
            <li>Todos nuestros productos cuentan con garantía del fabricante</li>
            <li>La garantía cubre defectos de fabricación, no daños por mal uso</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>6. Garantía del Producto</h2>
          <p>Todos nuestros audífonos cuentan con garantía del fabricante contra defectos de fábrica.</p>
          <ul>
            <li>La garantía no cubre daños por agua, golpes o mal uso</li>
            <li>Para hacer válida la garantía, se requiere factura de compra</li>
            <li>El tiempo de garantía varía según el fabricante (generalmente 6-12 meses)</li>
            <li>Los accesorios incluidos están cubiertos por la misma garantía</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. Privacidad y Datos Personales</h2>
          <p>
            Respetamos tu privacidad y protegemos tus datos personales de acuerdo con la ley colombiana de protección de
            datos (Ley 1581 de 2012).
          </p>
          <ul>
            <li>Tus datos son utilizados únicamente para procesar tu pedido</li>
            <li>No compartimos tu información con terceros sin tu consentimiento</li>
            <li>Utilizamos medidas de seguridad para proteger tu información</li>
            <li>Puedes solicitar la eliminación de tus datos en cualquier momento</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de este sitio web, incluyendo textos, imágenes, logos y diseños, es propiedad de nuestra
            empresa o de nuestros proveedores y está protegido por las leyes de propiedad intelectual.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Limitación de Responsabilidad</h2>
          <p>No nos hacemos responsables por:</p>
          <ul>
            <li>Daños indirectos o consecuentes derivados del uso de nuestros productos</li>
            <li>Problemas técnicos o interrupciones del servicio del sitio web</li>
            <li>Pérdidas de datos o información durante el proceso de compra</li>
            <li>Compatibilidad de los audífonos con dispositivos específicos</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>10. Modificaciones de los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones
            entrarán en vigor inmediatamente después de su publicación en el sitio web. Es responsabilidad del usuario
            revisar periódicamente estos términos.
          </p>
        </section>

        <section className="terms-section">
          <h2>11. Contacto</h2>
          <p>Para cualquier consulta sobre estos términos y condiciones, puedes contactarnos a través de:</p>
          <ul>
            <li>WhatsApp: +57 315 816 4656</li>
            <li>Horario de atención: Lunes a Sábado de 9:00 AM a 6:00 PM</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>12. Ley Aplicable</h2>
          <p>
            Estos términos y condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa será
            resuelta en los tribunales competentes de Colombia.
          </p>
        </section>

        <div className="terms-acceptance">
          <p>
            Al realizar una compra en nuestro sitio web, confirmas que has leído, entendido y aceptado estos términos y
            condiciones en su totalidad.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
