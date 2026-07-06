# Walkthrough: Formulario de Captura de Leads y Seguimiento de Descargas

He implementado con éxito la protección de descarga de la guía del comprador y la visualización de los leads correspondientes en los paneles de Administrador y de Broker.

---

## Cambios Realizados y Nueva Funcionalidad

### 1. Formulario Modal de Captura de Leads (Web Pública)
* **Intercepción de Clics**: Todos los enlaces a `dossier.html` (barra de navegación, botón de introducción a España y banner de llamada a la acción inferior) ahora son interceptados por `js/main.js`.
* **Formulario Bilingüe**: Al hacer clic en descargar, se despliega un formulario modal que solicita:
  - Nombre (First Name)
  - Apellidos (Last Name)
  - Correo Electrónico (Email Address)
  - Número de Teléfono (Phone Number)
* **Descarga Automática**: Al enviar el formulario con éxito, el sistema guarda el lead y abre la guía `dossier.html` en una pestaña nueva automáticamente.

### 2. Guardado en Base de Datos (Firebase & Demo Mode)
* He creado los métodos `saveDossierLead()` y `getDossierLeads()` en `js/auth-service.js` con soporte completo de doble canal:
  - **Producción**: Guarda en la colección de Firestore `dossier_leads`.
  - **Demo Mode**: Guarda en el array `App.demoData.dossier_leads` persistido en `localStorage` (bajo la clave `remax_demo_dossier_leads`).
* He inicializado datos ficticios de leads en `js/firebase-config.js` para que el panel muestre registros de prueba desde el primer inicio.

### 3. Sección de Leads para Administradores
* **admin.html (Directo)**: Añadida la sección de tabla "Buyer's Guide Downloads (Leads)" para visualizar la fecha, nombre, email, teléfono y origen de cada descarga.
* **js/views/admin-views.js (SPA)**: Integrado en el cargador del panel de administración general para poblar la tabla con los leads más recientes.

### 4. Sección de Leads para Brokers (Broker Inmomás)
* **dashboard.html**: Incorporada la sección de leads en el panel del partner (visible únicamente para usuarios con rol `broker`).
* **js/views/broker-views.js (SPA)**: Programada la lógica para cargar y poblar la tabla con la lista de descargas en tiempo real al ingresar al panel del Broker.

### 5. Corrección de Bug de Sidebar
* Se añadió el atributo `id="dashboard-sidebar"` a la etiqueta `<aside>` en `dashboard.html`. Esto soluciona la falta de vinculación del sidebar móvil que causaba errores menores al intentar abrir o colapsar el menú en teléfonos y tablets.

---

## Despliegue en Vivo
Todos los archivos editados fueron recompilados con `build_spa.py` e integrados en `app.html`, y finalmente pusheados a GitHub (`main`), activando la compilación automática de Vercel.

### Cómo testearlo:
1. Ve a la página pública de inicio en Vercel.
2. Haz clic en el botón de descarga del dossier PDF (por ejemplo, en el botón rojo de la sección sobre España).
3. Rellena el formulario modal que aparece en pantalla y pulsa enviar. Se te redirigirá a `dossier.html` en una pestaña nueva para guardarlo.
4. Entra al panel de login e inicia sesión con un rol adecuado:
   - **Administrador**: email `admin@remax-inmomas.com` (o `maia.honczaryk@remax.es`), contraseña `admin123`.
   - **Broker Inmomás**: email `john.broker@remaxusa.com`, contraseña `broker123`.
5. Comprueba la nueva sección **Buyer's Guide Downloads (Leads)** al fondo de la página, donde figurará el lead que acabas de registrar junto con los leads de prueba.
