name: Flutter CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Clonar repositorio
        uses: actions/checkout@v3

      - name: Instalar Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'

      - name: Obtener dependencias
        run: flutter pub get

      - name: Compilar APK (release)
        run: flutter build apk --release

      - name: Subir APK como artefacto
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: build/app/outputs/flutter-apk/app-release.apk 
