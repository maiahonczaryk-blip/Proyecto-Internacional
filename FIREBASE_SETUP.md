# Guía de Instalación y Conexión de Firebase
RE/MAX Inmomás — USA Realtor Alliance Portal

Esta guía detalla el proceso paso a paso para configurar tu entorno en la consola de Firebase, conectar el portal web en vivo y sembrar la base de datos Firestore con la estructura e información de prueba por defecto.

---

## Paso 1: Configurar el Proyecto en la Consola de Firebase

1. Entra a la [Consola de Firebase](https://console.firebase.google.com/).
2. Haz clic en **Crear un proyecto** (o selecciona uno existente).
3. Añade una **Aplicación Web** a tu proyecto:
   - Ve a la configuración del proyecto (icono de engranaje) -> **General**.
   - En la sección *Tus apps*, haz clic en el icono Web (`</>`).
   - Registra la aplicación y **copia las credenciales** del objeto de configuración `firebaseConfig`.

---

## Paso 2: Habilitar Autenticación (Email y Google)

1. En el menú lateral de Firebase, ve a **Build** -> **Authentication**.
2. Haz clic en **Comenzar** (Get Started).
3. Ve a la pestaña **Método de inicio de sesión** (Sign-in method):
   - **Correo electrónico/Contraseña**: Habilítalo y guarda.
   - **Google**: Habilítalo, selecciona el correo de soporte del proyecto y guarda.
4. **Cuentas de Demo Iniciales**:
   Ve a la pestaña **Users** y añade manualmente las cuentas de prueba básicas para poder entrar a los dashboards tras activar el modo live:
   - `admin@remax-inmomas.com` (Contraseña sugerida: `admin123`)
   - `carlos.agent@remax-inmomas.com` (Contraseña sugerida: `agent123`)
   - `john.broker@remaxusa.com` (Contraseña sugerida: `broker123`)
   - `mike.agent@remaxusa.com` (Contraseña sugerida: `realtor123`)

---

## Paso 3: Crear la Base de Datos Cloud Firestore

1. En el menú lateral de Firebase, ve a **Build** -> **Firestore Database**.
2. Haz clic en **Crear base de datos**.
3. Selecciona la ubicación de tu servidor de base de datos y elige **Iniciar en modo prueba** (o modo producción).
4. Ve a la pestaña **Reglas** (Rules) de Firestore, pega las siguientes reglas de seguridad y haz clic en **Publicar**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper to check if user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // User profile rules
    match /users/{userId} {
      allow read, write: if isAuthenticated();
    }
    
    // Clients rules
    match /clients/{clientId} {
      allow read, write: if isAuthenticated();
    }
    
    // Commissions rules
    match /commissions/{commissionId} {
      allow read, write: if isAuthenticated();
    }
    
    // Dossier leads rules
    match /dossier_leads/{leadId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## Paso 4: Conectar la Aplicación Local a Firebase

1. Abre el archivo [js/firebase-config.js](file:///Users/santiagocastro/Desktop/Projects%20Antigravity/Proyecto-Internacional/js/firebase-config.js) en tu editor.
2. Reemplaza el objeto `firebaseConfig` con los valores reales de tu consola de Firebase:
   ```javascript
   const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "TU_PROYECTO.firebaseapp.com",
     projectId: "TU_ID_DE_PROYECTO",
     storageBucket: "TU_PROYECTO.appspot.com",
     messagingSenderId: "TU_MESSAGING_SENDER_ID",
     appId: "TU_APP_ID"
   };
   ```
3. Desactiva el modo demo cambiando el flag a `false` (Línea 18):
   ```javascript
   App.demoMode = false;
   ```
4. Guarda el archivo.

---

## Paso 5: Sembrado y Migración de Base de Datos (CLI Migrations)

Una vez que la aplicación está conectada a Firebase, la base de datos de Firestore estará vacía. Para poblarla automáticamente y migrar la estructura de colecciones mediante la terminal:

1. **Instalar Dependencias**:
   Instala las librerías necesarias del proyecto ejecutando en tu terminal:
   ```bash
   npm install
   ```
2. **Descargar Archivo de Cuenta de Servicio**:
   - Ve a la consola de Firebase -> **Configuración del proyecto** (icono de engranaje) -> **Cuentas de servicio** (Service accounts).
   - Haz clic en el botón **Generar nueva clave privada**.
   - Descarga el archivo JSON y guárdalo en la raíz de este proyecto con el nombre:
     `firebase-service-account.json`
3. **Ejecutar la Migración**:
   Ejecuta el script de migración en la terminal:
   ```bash
   npm run db:migrate
   ```
4. El script leerá el archivo de configuración `js/firebase-config.js` y poblará Cloud Firestore automáticamente con todos los usuarios de prueba, clientes recomendados e historiales de comisiones.

Una vez completado, verás el mensaje de éxito en la consola y podrás iniciar sesión en el portal y utilizar todos los dashboards con datos reales.

