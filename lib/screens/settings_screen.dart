import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _selectedPlatform = 'Android';
  String _selectedLanguage = 'Español';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Plataforma',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ListTile(
            title: const Text('Android'),
            leading: Radio<String>(
              value: 'Android',
              groupValue: _selectedPlatform,
              onChanged: (value) {
                setState(() => _selectedPlatform = value!);
              },
            ),
          ),
          ListTile(
            title: const Text('iOS'),
            leading: Radio<String>(
              value: 'iOS',
              groupValue: _selectedPlatform,
              onChanged: (value) {
                setState(() => _selectedPlatform = value!);
              },
            ),
          ),
          ListTile(
            title: const Text('Tablet'),
            leading: Radio<String>(
              value: 'Tablet',
              groupValue: _selectedPlatform,
              onChanged: (value) {
                setState(() => _selectedPlatform = value!);
              },
            ),
          ),
          ListTile(
            title: const Text('Laptop'),
            leading: Radio<String>(
              value: 'Laptop',
              groupValue: _selectedPlatform,
              onChanged: (value) {
                setState(() => _selectedPlatform = value!);
              },
            ),
          ),
          const Divider(height: 32),
          const Text(
            'Idioma',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ListTile(
            title: const Text('Español'),
            leading: Radio<String>(
              value: 'Español',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() => _selectedLanguage = value!);
              },
            ),
          ),
          ListTile(
            title: const Text('English'),
            leading: Radio<String>(
              value: 'English',
              groupValue: _selectedLanguage,
              onChanged: (value) {
                setState(() => _selectedLanguage = value!);
              },
            ),
          ),
          const Divider(height: 32),
          const Text(
            'País',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const ListTile(
            leading: Icon(Icons.location_on),
            title: Text('México'),
            subtitle: Text('Región detectada automáticamente'),
          ),
        ],
      ),
    );
  }
}
