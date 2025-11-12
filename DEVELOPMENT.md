# Guía de Desarrollo - Tokyo Roulette Predicciones

## Requisitos Previos

- Flutter SDK 3.0.0 o superior
- Dart SDK (incluido con Flutter)
- Android Studio / Xcode para desarrollo móvil
- Cuenta de Firebase
- Cuenta de Stripe

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Melampe001/Tokyo-Predictor-Roulette.-.git
cd Tokyo-Predictor-Roulette.-
```

### 2. Instalar Dependencias

```bash
flutter pub get
```

Este comando descarga todas las dependencias especificadas en `pubspec.yaml`:
- flutter_stripe
- firebase_core
- cloud_firestore
- in_app_purchase
- Y más...

### 3. Configurar Firebase

```bash
# Instalar FlutterFire CLI
dart pub global activate flutterfire_cli

# Configurar Firebase para el proyecto
flutterfire configure
```

Sigue las instrucciones para:
- Seleccionar o crear un proyecto de Firebase
- Habilitar plataformas (Android, iOS)
- Descargar archivos de configuración

### 4. Configurar Stripe

1. Crea una cuenta en [Stripe Dashboard](https://dashboard.stripe.com/)
2. Obtén tus API keys (publishable y secret)
3. En `lib/main.dart`, actualiza:

```dart
Stripe.publishableKey = 'tu_publishable_key_aqui';
```

4. Crea productos en Stripe:
   - Producto "Advanced" - $199 USD
   - Producto "Premium" - $299 USD

## Desarrollo

### Ejecutar la Aplicación

```bash
# En emulador/dispositivo Android
flutter run

# En modo release
flutter run --release

# En un dispositivo específico
flutter devices  # Lista dispositivos disponibles
flutter run -d <device_id>
```

### Ejecutar Tests

```bash
# Todos los tests
flutter test

# Tests con cobertura
flutter test --coverage

# Test específico
flutter test test/roulette_service_test.dart
```

### Análisis de Código

```bash
# Analizar código
flutter analyze

# Formatear código
dart format .

# Verificar formato
dart format --set-exit-if-changed .
```

## Estructura del Proyecto

```
tokyo_roulette_predicciones/
├── lib/
│   ├── main.dart                 # Punto de entrada
│   ├── models/
│   │   └── roulette_result.dart  # Modelos de datos
│   ├── screens/
│   │   ├── login_screen.dart     # Pantalla de login
│   │   ├── main_screen.dart      # Pantalla principal
│   │   ├── settings_screen.dart  # Configuración
│   │   └── manual_screen.dart    # Manual de uso
│   ├── services/
│   │   └── roulette_service.dart # Lógica de negocio
│   └── widgets/                  # Widgets reutilizables (futuro)
├── test/
│   └── roulette_service_test.dart # Tests unitarios
├── android/                       # Configuración Android
├── pubspec.yaml                   # Dependencias
└── README.md                      # Este archivo
```

## Build para Producción

### Android

#### 1. Configurar Keystore

```bash
# Generar keystore
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Crear android/key.properties
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=<ruta-a-keystore.jks>
```

#### 2. Actualizar build.gradle

En `android/app/build.gradle`, configurar signing:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

#### 3. Build APK/AAB

```bash
# APK de release
flutter build apk --release

# Android App Bundle (recomendado para Play Store)
flutter build appbundle --release

# APK split por ABI (más pequeños)
flutter build apk --split-per-abi --release
```

Los archivos se generan en:
- `build/app/outputs/flutter-apk/app-release.apk`
- `build/app/outputs/bundle/release/app-release.aab`

### iOS (requiere macOS)

```bash
# Build para iOS
flutter build ios --release

# Abrir en Xcode para firmar y subir
open ios/Runner.xcworkspace
```

## Configuración de Firebase

### Servicios a Habilitar

1. **Authentication**
   - Email/Password
   - Anonymous (opcional)

2. **Cloud Firestore**
   - Colecciones:
     - `users` - Datos de usuarios
     - `history` - Historial de giros

3. **Remote Config**
   - Parámetros:
     - `theme_color` - Color del tema
     - `theme_update_interval` - Intervalo de actualización

### Reglas de Seguridad

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /history/{userId}/spins/{spin} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Configuración de Stripe

### 1. Webhooks

Configura webhooks en Stripe Dashboard para:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.deleted`
- `customer.subscription.updated`

### 2. Productos

Crea productos en Stripe con:
- **Advanced Plan**: $199 USD
  - Análisis de sectores
  - Sin anuncios
  
- **Premium Plan**: $299 USD
  - Todo lo de Advanced
  - Gráficos avanzados
  - Análisis con IA

## Testing

### Tests Unitarios

```bash
flutter test test/roulette_service_test.dart -r expanded
```

Pruebas incluidas:
- ✅ Generación de números aleatorios
- ✅ Identificación de colores
- ✅ Análisis de frecuencias
- ✅ Análisis de sectores
- ✅ Serialización de modelos

### Tests de Integración (Futuro)

```bash
flutter test integration_test/
```

### Tests en Dispositivos Reales

```bash
flutter run --release
```

Verifica:
- Login funcional
- Giros de ruleta aleatorios
- Historial persistente
- Análisis correcto
- Navegación fluida

## Despliegue

### Google Play Store

1. Crear cuenta de desarrollador ($25 una vez)
2. Crear aplicación en Play Console
3. Completar información de la tienda:
   - Título: "Tokyo Roulette Predicciones"
   - Descripción corta y larga
   - Capturas de pantalla (mínimo 2)
   - Ícono (512x512 px)
   - Clasificación de contenido
   - Privacy policy URL
   - Términos de servicio

4. Subir AAB:
```bash
flutter build appbundle --release
```

5. Testing interno → Cerrado → Abierto → Producción

### Consideraciones Legales

- ⚠️ Incluir disclaimers claros
- ⚠️ No promocionar apuestas reales
- ⚠️ Verificación de edad (18+)
- ⚠️ Cumplir con regulaciones locales
- ⚠️ Privacy policy GDPR compliant
- ⚠️ Geofencing para México

## Troubleshooting

### Error: Firebase not initialized

```dart
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### Error: Stripe publishable key

Asegúrate de haber configurado:
```dart
Stripe.publishableKey = 'pk_test_...';
```

### Error de dependencias

```bash
flutter clean
flutter pub get
```

### Problemas de build

```bash
cd android
./gradlew clean
cd ..
flutter build apk
```

## Recursos

- [Documentación Flutter](https://docs.flutter.dev/)
- [Firebase Flutter](https://firebase.flutter.dev/)
- [Stripe Flutter](https://pub.dev/packages/flutter_stripe)
- [Google Play Guidelines](https://play.google.com/console/about/guides/)

## Soporte

Para preguntas o problemas:
1. Revisa la documentación
2. Abre un issue en GitHub
3. Contacta al equipo de desarrollo

## Licencia

CC0 1.0 Universal - Ver LICENSE para más detalles.
