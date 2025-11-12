import 'package:flutter_test/flutter_test.dart';
import 'package:tokyo_roulette_predicciones/main.dart';

void main() {
  testWidgets('App initializes and shows LoginScreen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that LoginScreen is shown
    expect(find.text('Tokyo Roulette\nPredicciones'), findsOneWidget);
    expect(find.text('Simulador educativo para análisis de ruleta'), findsOneWidget);
    
    // Verify email input field exists
    expect(find.text('Email'), findsOneWidget);
    
    // Verify start button exists
    expect(find.text('Comenzar'), findsOneWidget);
    
    // Verify disclaimer exists
    expect(find.textContaining('Solo simulación educativa'), findsOneWidget);
  });

  testWidgets('LoginScreen validates email input', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Try to login without email
    await tester.tap(find.text('Comenzar'));
    await tester.pump();

    // Should show validation message
    expect(find.text('Por favor ingrese un email válido'), findsOneWidget);
  });

  testWidgets('LoginScreen accepts valid email and navigates', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Enter valid email
    await tester.enterText(find.byType(TextField), 'test@example.com');
    
    // Tap login button
    await tester.tap(find.text('Comenzar'));
    await tester.pump();
    
    // Should show loading indicator
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    // Wait for navigation
    await tester.pumpAndSettle();
    
    // Should navigate to MainScreen
    expect(find.text('Tokyo Roulette'), findsOneWidget);
    expect(find.text('Presiona girar'), findsOneWidget);
  });
}
