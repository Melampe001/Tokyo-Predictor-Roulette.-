import 'package:flutter/material.dart';

class ManualScreen extends StatelessWidget {
  const ManualScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual de Uso'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Text(
            'Bienvenido a Tokyo Roulette Predicciones',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'Esta aplicación es un simulador educativo que te permite:',
            style: TextStyle(fontSize: 16),
          ),
          SizedBox(height: 12),
          BulletPoint(text: 'Generar giros aleatorios de ruleta europea y americana'),
          BulletPoint(text: 'Analizar historial de resultados'),
          BulletPoint(text: 'Identificar números calientes y fríos'),
          BulletPoint(text: 'Recibir sugerencias basadas en patrones estadísticos'),
          SizedBox(height: 24),
          Text(
            'Características del Simulador',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 12),
          Text(
            '• RNG Seguro: Utiliza generación de números aleatorios certificada\n'
            '• Análisis Estadístico: Frecuencias, tendencias y patrones\n'
            '• Sectores: Voisins du Zéro, Orphelins, Tiers du Cylindre\n'
            '• Historial: Guarda hasta 100 resultados recientes',
            style: TextStyle(fontSize: 14),
          ),
          SizedBox(height: 24),
          Text(
            'Modelo Freemium',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 12),
          Text(
            'Gratuita: Análisis básico de números calientes/fríos\n'
            'Avanzada (\$199): Análisis de sectores específicos\n'
            'Premium (\$299): Análisis completo con IA y gráficos avanzados',
            style: TextStyle(fontSize: 14),
          ),
          SizedBox(height: 24),
          Text(
            'Importante - Disclaimer',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.red),
          ),
          SizedBox(height: 12),
          Text(
            'Esta aplicación es SOLO para fines educativos y de simulación. '
            'NO promueve ni facilita apuestas reales de dinero. '
            'No hay garantía de predicciones precisas. '
            'Los resultados son completamente aleatorios. '
            'Solo para mayores de 18 años.',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          SizedBox(height: 24),
          Text(
            'Desarrollo',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 12),
          Text(
            'Desarrollado con Flutter para múltiples plataformas: '
            'Android, iOS, tablets y laptops. '
            'Utiliza Firebase para autenticación y Remote Config. '
            'Pagos seguros con Stripe.',
            style: TextStyle(fontSize: 14),
          ),
          SizedBox(height: 24),
          Text(
            'Soporte',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 12),
          Text(
            'Para comentarios o soporte, utiliza el formulario de contacto '
            'disponible en la aplicación.',
            style: TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class BulletPoint extends StatelessWidget {
  final String text;

  const BulletPoint({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
