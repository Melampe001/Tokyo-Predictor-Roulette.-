# GitHub Issues to Create

Please create the following GitHub issues manually:

---

## Issue 1: Integrate real TokioAI implementation into server (replace adapter stub)

**Title:** Integrate real TokioAI implementation into server (replace adapter stub)

**Labels:** enhancement, backend

**Body:**

### Description

The backend server currently uses `src/tokioai-adapter.js` which provides a fallback stub implementation when the TokioAI module cannot be loaded. This was intentional for initial development, but now we need to ensure the real TokioAI implementation is fully integrated and the stubs are only used as an absolute fallback.

### Steps

1. Verify that `src/tokioai.js` is complete and all required methods are implemented:
   - `captureResult(value)`
   - `analyzeBatch(count)`
   - `generatePDF(outputPath, includeStats)`
   - `saveEncrypted(filepath)`
   - `loadEncrypted(source)`
   - `getStatistics()`
   - `clearResults()`
   - `close()`

2. Test the adapter loading mechanism:
   ```bash
   npm start
   # Check logs for: "✓ TokioAI module loaded successfully"
   # Should NOT see: "⚠ Using TokioAI stub"
   ```

3. Run integration tests to verify all functionality:
   ```bash
   npm test
   npm run test:legacy
   ```

4. Test all WebSocket message types:
   - `result` - Submit new result
   - `request-analysis` - Request analysis
   - `request-results` - Get recent results
   - `request-statistics` - Get statistics

5. Verify REST API endpoints with real TokioAI:
   - `POST /api/result`
   - `GET /api/analysis`
   - `GET /api/results`
   - `GET /api/statistics`

6. If stubs are no longer needed, consider removing the fallback logic or documenting clearly when stubs should be used.

### Success Criteria

- [ ] Server starts with real TokioAI implementation
- [ ] All REST endpoints work correctly
- [ ] All WebSocket message types work correctly
- [ ] Tests pass with real implementation
- [ ] Analysis provides meaningful results
- [ ] No stub warnings in production logs

### Files to Review

- `src/tokioai-adapter.js`
- `src/tokioai.js`
- `server.js`
- `test/backend.test.js`

---

## Issue 2: Add Flutter client integration example (Tokyoapps)

**Title:** Add Flutter client integration example (Tokyoapps)

**Labels:** enhancement, documentation, flutter

**Body:**

### Description

Provide a complete example of how to integrate the Tokyo Predictor backend with a Flutter client application (Tokyoapps). This should include WebSocket connection examples, API usage, and sample Dart code.

### Requirements

1. **WebSocket Connection Example**

Create a Flutter example showing WebSocket connectivity:

```dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class TokioAIClient {
  late WebSocketChannel channel;
  final String serverUrl;

  TokioAIClient(this.serverUrl);

  void connect() {
    channel = WebSocketChannel.connect(
      Uri.parse('ws://$serverUrl:8080'),
    );
    
    channel.stream.listen(
      (message) {
        final data = jsonDecode(message);
        handleMessage(data);
      },
      onError: (error) => print('WebSocket error: $error'),
      onDone: () => print('WebSocket closed'),
    );
  }

  void submitResult(int value) {
    channel.sink.add(jsonEncode({
      'type': 'result',
      'value': value,
    }));
  }

  void requestAnalysis({int? count}) {
    channel.sink.add(jsonEncode({
      'type': 'request-analysis',
      if (count != null) 'count': count,
    }));
  }

  void handleMessage(Map<String, dynamic> data) {
    switch (data['type']) {
      case 'connected':
        print('Connected to server');
        break;
      case 'result-update':
        print('New result: ${data['data']}');
        break;
      case 'analysis':
        print('Analysis: ${data['data']}');
        break;
      case 'error':
        print('Error: ${data['message']}');
        break;
    }
  }

  void dispose() {
    channel.sink.close();
  }
}
```

2. **REST API Integration Example**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class TokioAIAPI {
  final String baseUrl;

  TokioAIAPI(this.baseUrl);

  Future<Map<String, dynamic>> submitResult(int value) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/result'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'value': value}),
    );
    
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to submit result');
    }
  }

  Future<Map<String, dynamic>> getAnalysis() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/analysis'),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get analysis');
    }
  }
}
```

3. **Documentation**

- Create `docs/FLUTTER_INTEGRATION.md` with complete examples
- Add WebSocket message format documentation
- Include error handling examples
- Document connection lifecycle (connect, disconnect, reconnect)
- Provide state management examples (Provider, Bloc, or Riverpod)

4. **Example App** (Optional)

Create a minimal Flutter app in `examples/flutter_client/` that demonstrates:
- Connecting to the backend
- Submitting results via WebSocket
- Displaying real-time analysis updates
- Handling connection errors

### WebSocket Message Reference

**Outgoing (Flutter → Server):**
```dart
// Submit result
{'type': 'result', 'value': 12}

// Request analysis
{'type': 'request-analysis', 'count': 10}  // count optional

// Request results
{'type': 'request-results', 'limit': 50}   // limit optional

// Request statistics
{'type': 'request-statistics'}

// Ping
{'type': 'ping'}
```

**Incoming (Server → Flutter):**
```dart
// Connected
{'type': 'connected', 'message': '...', 'timestamp': '...'}

// Result update
{'type': 'result-update', 'data': {...}}

// Analysis
{'type': 'analysis', 'data': {...}}

// Results
{'type': 'results', 'data': [...], 'total': 100}

// Statistics
{'type': 'statistics', 'data': {...}}

// Error
{'type': 'error', 'message': '...'}

// Pong
{'type': 'pong', 'timestamp': '...'}
```

### Deliverables

- [ ] Flutter WebSocket client example
- [ ] Flutter REST API client example
- [ ] Documentation in `docs/FLUTTER_INTEGRATION.md`
- [ ] Error handling and reconnection logic
- [ ] Example app (optional)

### Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  web_socket_channel: ^2.4.0
  http: ^1.1.0
```

---

## Issue 3: Set up automated Play Store deployment (Fastlane)

**Title:** Set up automated Play Store deployment (Fastlane)

**Labels:** enhancement, ci/cd, android

**Body:**

### Description

Automate the deployment of Android APK/AAB to Google Play Store using Fastlane and GitHub Actions. This will streamline the release process and ensure consistent deployments.

### Prerequisites

1. **Google Play Console Setup**
   - Google Play Developer account
   - App created in Play Console
   - Service account with API access

2. **Signing Keys**
   - Release keystore file (`signing-key.jks`)
   - Keystore password
   - Key alias and password

### Implementation Steps

#### 1. Install and Configure Fastlane

```bash
# Install Fastlane
gem install fastlane

# Initialize Fastlane for Android
cd android
fastlane init
```

#### 2. Create Fastlane Configuration

Create `android/fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Deploy to Google Play Internal Testing"
  lane :internal do
    gradle(
      task: "bundle",
      build_type: "Release",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_FILE"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    
    upload_to_play_store(
      track: 'internal',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      json_key: ENV["PLAY_STORE_JSON_KEY"],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Deploy to Google Play Beta"
  lane :beta do
    gradle(task: "bundle", build_type: "Release")
    upload_to_play_store(
      track: 'beta',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      json_key: ENV["PLAY_STORE_JSON_KEY"]
    )
  end

  desc "Deploy to Google Play Production"
  lane :production do
    gradle(task: "bundle", build_type: "Release")
    upload_to_play_store(
      track: 'production',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      json_key: ENV["PLAY_STORE_JSON_KEY"]
    )
  end
end
```

#### 3. GitHub Actions Workflow

Create `.github/workflows/android-release.yml`:

```yaml
name: Android Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.0'
        bundler-cache: true
    
    - name: Install Fastlane
      run: |
        gem install fastlane
        cd android && bundle install
    
    - name: Decode Keystore
      run: |
        echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/signing-key.jks
    
    - name: Decode Play Store JSON Key
      run: |
        echo "${{ secrets.PLAY_STORE_JSON_KEY }}" > play-store-key.json
    
    - name: Deploy to Play Store (Internal)
      env:
        KEYSTORE_FILE: ${{ github.workspace }}/android/app/signing-key.jks
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        PLAY_STORE_JSON_KEY: ${{ github.workspace }}/play-store-key.json
      run: |
        cd android
        fastlane internal
```

#### 4. Required GitHub Secrets

Configure these secrets in GitHub Settings → Secrets and variables → Actions:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `KEYSTORE_BASE64` | Base64-encoded keystore file | `base64 -i signing-key.jks` |
| `KEYSTORE_PASSWORD` | Keystore password | From key generation |
| `KEY_ALIAS` | Key alias | From key generation |
| `KEY_PASSWORD` | Key password | From key generation |
| `PLAY_STORE_JSON_KEY` | Google Play service account JSON | From Play Console API access |

#### 5. Generate Play Store Service Account

1. Go to Google Play Console
2. Navigate to Settings → API access
3. Create a new service account
4. Download the JSON key file
5. Grant necessary permissions (Release to production)

### Testing

```bash
# Test locally (requires secrets as environment variables)
cd android
fastlane internal
```

### Deliverables

- [ ] Fastlane configured in `android/` directory
- [ ] GitHub Actions workflow for automated deployment
- [ ] Documentation for setting up secrets
- [ ] Test deployment to internal track
- [ ] Update README with release process

### Security Notes

- **Never commit** keystore files or JSON keys to the repository
- Use GitHub Secrets for all sensitive data
- Add keystore and JSON files to `.gitignore`
- Rotate keys periodically

### References

- [Fastlane Android Documentation](https://docs.fastlane.tools/getting-started/android/setup/)
- [Google Play Publishing](https://docs.fastlane.tools/actions/upload_to_play_store/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

_After creating these issues, update the README with links to them._
