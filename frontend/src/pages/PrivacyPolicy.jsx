import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import '../styles/privacy.css';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-container">
      <SEO
        title="Política de Privacidad"
        description="Conoce cómo protegemos tu información personal en Karell Premium. Política de privacidad y tratamiento de datos."
      />
      <div className="privacy-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Volver
        </button>
        <h1>Política de Privacidad</h1>
        <p className="last-update">Última actualización: 28 de noviembre de 2025</p>
      </div>

      <div className="privacy-content">
        <section className="privacy-section">
          <h2>1. Introducción</h2>
          <p>
            En nuestra tienda online de audífonos, respetamos tu privacidad y nos comprometemos a proteger tus datos
            personales. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos tu
            información personal de acuerdo con la Ley 1581 de 2012 de Colombia y demás normativas aplicables sobre
            protección de datos personales.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Responsable del Tratamiento de Datos</h2>
          <p>
            El responsable del tratamiento de tus datos personales es nuestra empresa, quien garantiza el cumplimiento
            de las disposiciones legales vigentes en materia de protección de datos.
          </p>
          <ul>
            <li>
              <strong>Contacto:</strong> WhatsApp +57 315 816 4656
            </li>
            <li>
              <strong>Horario de atención:</strong> Lunes a Sábado de 9:00 AM a 6:00 PM
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Información que Recopilamos</h2>
          <p>Recopilamos diferentes tipos de información para brindarte un mejor servicio:</p>

          <h3>3.1 Información que nos proporcionas directamente:</h3>
          <ul>
            <li>Nombre y apellido</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Dirección de envío</li>
            <li>Ciudad y departamento</li>
            <li>Información de pago (procesada de forma segura por Wompi)</li>
            <li>Foto de perfil (opcional)</li>
          </ul>

          <h3>3.2 Información recopilada automáticamente:</h3>
          <ul>
            <li>Dirección IP</li>
            <li>Tipo de navegador y dispositivo</li>
            <li>Páginas visitadas en nuestro sitio</li>
            <li>Fecha y hora de acceso</li>
            <li>Productos visualizados y añadidos al carrito</li>
          </ul>

          <h3>3.3 Información de cookies:</h3>
          <ul>
            <li>Preferencias de usuario</li>
            <li>Sesión de inicio de sesión</li>
            <li>Contenido del carrito de compras</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Uso de tu Información</h2>
          <p>Utilizamos tus datos personales para los siguientes propósitos:</p>
          <ul>
            <li>Procesar y gestionar tus pedidos</li>
            <li>Enviar confirmaciones de compra y actualizaciones de envío</li>
            <li>Proporcionar atención al cliente</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Enviarte información sobre promociones (solo si has dado tu consentimiento)</li>
            <li>Prevenir fraudes y garantizar la seguridad</li>
            <li>Cumplir con obligaciones legales y fiscales</li>
            <li>Personalizar tu experiencia de compra</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Base Legal para el Tratamiento de Datos</h2>
          <p>El tratamiento de tus datos personales se basa en:</p>
          <ul>
            <li>
              <strong>Ejecución del contrato:</strong> Para procesar tus pedidos y brindarte el servicio solicitado
            </li>
            <li>
              <strong>Consentimiento:</strong> Para enviarte comunicaciones comerciales
            </li>
            <li>
              <strong>Interés legítimo:</strong> Para mejorar nuestros servicios y prevenir fraudes
            </li>
            <li>
              <strong>Obligación legal:</strong> Para cumplir con requerimientos fiscales y legales
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Compartir tu Información</h2>
          <p>
            No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto en los siguientes
            casos:
          </p>
          <ul>
            <li>
              <strong>Proveedores de servicios:</strong> Compartimos datos con empresas de mensajería para realizar
              entregas
            </li>
            <li>
              <strong>Procesadores de pago:</strong> Wompi procesa tus pagos de forma segura (no almacenamos datos de
              tarjetas)
            </li>
            <li>
              <strong>Cumplimiento legal:</strong> Cuando sea requerido por autoridades competentes
            </li>
            <li>
              <strong>Protección de derechos:</strong> Para proteger nuestros derechos legales o seguridad
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>7. Seguridad de tus Datos</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:</p>
          <ul>
            <li>Cifrado SSL/TLS para todas las comunicaciones</li>
            <li>Almacenamiento seguro de contraseñas mediante hash</li>
            <li>Acceso restringido a datos personales solo para personal autorizado</li>
            <li>Copias de seguridad regulares de la base de datos</li>
            <li>Monitoreo constante de actividades sospechosas</li>
            <li>Actualizaciones de seguridad periódicas</li>
          </ul>
          <p>
            Sin embargo, ningún sistema es 100% seguro. Te recomendamos usar contraseñas fuertes y no compartir tus
            credenciales de acceso.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Tus Derechos</h2>
          <p>De acuerdo con la Ley 1581 de 2012, tienes los siguientes derechos sobre tus datos personales:</p>
          <ul>
            <li>
              <strong>Acceso:</strong> Conocer qué datos tenemos sobre ti
            </li>
            <li>
              <strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos
            </li>
            <li>
              <strong>Actualización:</strong> Actualizar tu información personal
            </li>
            <li>
              <strong>Supresión:</strong> Solicitar la eliminación de tus datos (sujeto a obligaciones legales)
            </li>
            <li>
              <strong>Revocación:</strong> Retirar tu consentimiento en cualquier momento
            </li>
            <li>
              <strong>Oposición:</strong> Oponerte al tratamiento de tus datos en ciertos casos
            </li>
          </ul>
          <p>Para ejercer estos derechos, contáctanos a través de WhatsApp al +57 315 816 4656.</p>
        </section>

        <section className="privacy-section">
          <h2>9. Retención de Datos</h2>
          <p>Conservamos tus datos personales durante el tiempo necesario para:</p>
          <ul>
            <li>Cumplir con los propósitos para los que fueron recopilados</li>
            <li>Cumplir con obligaciones legales (generalmente 5 años para datos fiscales)</li>
            <li>Resolver disputas y hacer cumplir nuestros acuerdos</li>
          </ul>
          <p>Una vez que ya no necesitemos tus datos, los eliminaremos de forma segura o los anonimizaremos.</p>
        </section>

        <section className="privacy-section">
          <h2>10. Cookies y Tecnologías Similares</h2>
          <p>Utilizamos cookies y tecnologías similares para mejorar tu experiencia:</p>

          <h3>Tipos de cookies que usamos:</h3>
          <ul>
            <li>
              <strong>Cookies esenciales:</strong> Necesarias para el funcionamiento del sitio (carrito, sesión)
            </li>
            <li>
              <strong>Cookies de preferencias:</strong> Recuerdan tus configuraciones y preferencias
            </li>
            <li>
              <strong>Cookies de análisis:</strong> Nos ayudan a entender cómo usas el sitio
            </li>
          </ul>
          <p>
            Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad del sitio.
            Los datos del carrito y la sesión se almacenan localmente en tu navegador.
          </p>
        </section>

        <section className="privacy-section">
          <h2>11. Transferencias Internacionales</h2>
          <p>
            Tus datos personales se almacenan y procesan en servidores ubicados en Colombia. En caso de utilizar
            servicios de terceros que puedan transferir datos fuera de Colombia, nos aseguramos de que cumplan con
            estándares adecuados de protección de datos.
          </p>
        </section>

        <section className="privacy-section">
          <h2>12. Menores de Edad</h2>
          <p>
            Nuestro sitio no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal de
            menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos de inmediato.
          </p>
        </section>

        <section className="privacy-section">
          <h2>13. Enlaces a Sitios Externos</h2>
          <p>
            Nuestro sitio puede contener enlaces a sitios web de terceros (redes sociales, pasarelas de pago). No somos
            responsables de las prácticas de privacidad de estos sitios. Te recomendamos leer sus políticas de
            privacidad.
          </p>
        </section>

        <section className="privacy-section">
          <h2>14. Cambios en esta Política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios
            entrarán en vigor inmediatamente después de su publicación en el sitio web. La fecha de "Última
            actualización" al inicio del documento indica cuándo se realizó la última modificación.
          </p>
          <p>
            Te recomendamos revisar esta política periódicamente para estar informado sobre cómo protegemos tu
            información.
          </p>
        </section>

        <section className="privacy-section">
          <h2>15. Contacto y Consultas</h2>
          <p>
            Si tienes preguntas, dudas o deseas ejercer tus derechos sobre tus datos personales, puedes contactarnos:
          </p>
          <ul>
            <li>
              <strong>WhatsApp:</strong> +57 315 816 4656
            </li>
            <li>
              <strong>Horario:</strong> Lunes a Sábado de 9:00 AM a 6:00 PM
            </li>
          </ul>
          <p>
            Responderemos a tu solicitud en un plazo máximo de 15 días hábiles, de acuerdo con la normativa colombiana.
          </p>
        </section>

        <section className="privacy-section">
          <h2>16. Autorización de Tratamiento de Datos</h2>
          <p>
            Al crear una cuenta, realizar una compra o proporcionar tus datos personales en nuestro sitio, aceptas esta
            Política de Privacidad y autorizas el tratamiento de tus datos personales de acuerdo con lo establecido en
            este documento.
          </p>
        </section>

        <div className="privacy-acceptance">
          <p>
            <strong>Declaración de Consentimiento:</strong> Al utilizar nuestro sitio web y nuestros servicios,
            confirmas que has leído, entendido y aceptado esta Política de Privacidad, y autorizas el tratamiento de tus
            datos personales conforme a lo aquí establecido.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
