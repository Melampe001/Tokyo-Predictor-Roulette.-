# GitHub Issues to Create

This document describes three GitHub issues that should be created for the Tokyo Predictor Roulette project.

⚠️ **Note:** These issues should be created manually via the GitHub web interface or CLI. They are documented here as part of the PR requirements.

---

## Issue 1: Integrate real TokioAI implementation into server

**Title:** Integrate real TokioAI implementation into server

**Labels:** enhancement, server, integration

**Body:**

```markdown
## Overview

The backend server currently uses the TokioAI adapter (`src/tokioai-adapter.js`) which includes stub fallback functionality. The real TokioAI module is imported and working, but additional verification and cleanup is needed.

## Steps to Complete

1. **Verify TokioAI Integration**
   - Test all adapter functions with real TokioAI implementation
   - Ensure `captureResult`, `analyzeBatch`, `generatePDF`, and `saveEncrypted` work correctly
   - Verify WebSocket message handling with real TokioAI

2. **Remove Stub Code**
   - Once verified, remove the `TokioAIStub` class from `src/tokioai-adapter.js`
   - Remove fallback logic that switches to stub mode
   - Update logging to reflect production-ready status

3. **Test End-to-End**
   - Test REST API endpoints with real TokioAI
   - Test WebSocket connections and real-time updates
   - Verify analysis accuracy and performance
   - Test PDF generation and encryption features

4. **Update Documentation**
   - Remove TODO comments about stub implementation
   - Update README.md to reflect production-ready status
   - Document any specific TokioAI configuration requirements

## Verification Checklist

- [ ] All adapter functions work with real TokioAI
- [ ] Stub code removed from adapter
- [ ] End-to-end tests pass with real implementation
- [ ] Documentation updated
- [ ] No warnings about stub mode in production

## Related Files

- `src/tokioai-adapter.js`
- `server.js`
- `test/backend.test.js`
- `README.md`
```

---

## Issue 2: Add Flutter client integration example (Tokyoapps)

**Title:** Add Flutter client integration example (Tokyoapps)

**Labels:** enhancement, documentation, flutter, client

**Body:**

```markdown
## Overview

Provide a comprehensive example of how to integrate a Flutter/Dart client application with the Tokyo Predictor Roulette backend server via WebSocket.

## Scope

Create documentation and example code showing:
1. WebSocket connection setup in Dart
2. Message format specifications
3. Example Flutter widget implementation
4. Error handling and reconnection logic

## WebSocket Message Examples

### Client → Server Messages

**Submit a Result:**
```json
{
  "type": "result",
  "value": 25
}
```

**Request Analysis:**
```json
{
  "type": "request-analysis"
}
```

**Request Recent Results:**
```json
{
  "type": "request-results",
  "count": 50
}
```

### Server → Client Messages

**Connection Established:**
```json
{
  "type": "connected",
  "message": "Connected to Tokyo Predictor Roulette server",
  "usingStub": false
}
```

**Result Update (broadcast):**
```json
{
  "type": "result-update",
  "data": {
    "resultado": 25,
    "fecha": "4/11/2025",
    "hora": "10:30:15",
    "timestamp": 1762246007819
  }
}
```

## Dart/Flutter Example Snippet

```dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class TokyoPredictorClient {
  final String serverUrl;
  WebSocketChannel? _channel;
  
  TokyoPredictorClient({required this.serverUrl});
  
  void connect() {
    _channel = WebSocketChannel.connect(Uri.parse(serverUrl));
    
    _channel!.stream.listen(
      (message) {
        final data = jsonDecode(message);
        _handleMessage(data);
      },
      onError: (error) => _reconnect(),
      onDone: () => _reconnect(),
    );
  }
  
  void submitResult(int value) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode({
        'type': 'result',
        'value': value,
      }));
    }
  }
  
  void dispose() {
    _channel?.sink.close();
  }
}
```

## Implementation Tasks

- [ ] Create example Flutter project structure
- [ ] Implement WebSocket client service
- [ ] Create example screens/widgets
- [ ] Add error handling and reconnection logic
- [ ] Document configuration (server URL, etc.)
- [ ] Add example to repository (e.g., `examples/flutter-client/`)
- [ ] Update main README.md with Flutter integration section

## Dependencies

Required Dart packages:
- `web_socket_channel: ^2.4.0`
- `provider: ^6.1.1` (optional, for state management)
```

---

## Issue 3: Set up automated Play Store deployment (Fastlane)

**Title:** Set up automated Play Store deployment with Fastlane

**Labels:** enhancement, deployment, ci/cd, android

**Body:**

```markdown
## Overview

Implement automated deployment to Google Play Store using Fastlane for the Tokyo Predictor Roulette Android application.

## Required GitHub Secrets

Add these secrets to the repository (Settings → Secrets and variables → Actions):

### Android Keystore Secrets

- `KEYSTORE_BASE64` - Base64 encoded keystore file
- `KEYSTORE_PASSWORD` - Password for the keystore file
- `KEY_ALIAS` - Alias name for the key in keystore
- `KEY_PASSWORD` - Password for the key

### Google Play Console Secrets

- `PLAY_STORE_JSON_KEY` - Service account JSON key from Google Play Console

## Fastlane Configuration Example

Create `android/fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Deploy to Google Play Internal Testing"
  lane :internal do
    gradle(task: 'bundle', build_type: 'Release')
    upload_to_play_store(
      track: 'internal',
      aab: '../build/app/outputs/bundle/release/app-release.aab',
      json_key_data: ENV['PLAY_STORE_JSON_KEY']
    )
  end
  
  desc "Deploy to Google Play Beta"
  lane :beta do
    gradle(task: 'bundle', build_type: 'Release')
    upload_to_play_store(
      track: 'beta',
      aab: '../build/app/outputs/bundle/release/app-release.aab',
      json_key_data: ENV['PLAY_STORE_JSON_KEY'],
      rollout: '0.1'
    )
  end
end
```

## Implementation Steps

1. **Set up Google Play Console**
   - [ ] Create application in Play Console
   - [ ] Complete store listing
   - [ ] Create service account for API access

2. **Configure Signing**
   - [ ] Generate release keystore
   - [ ] Update `android/app/build.gradle` with signing config
   - [ ] Store keystore secrets in GitHub

3. **Install and Configure Fastlane**
   - [ ] Add Fastlane to project
   - [ ] Create Fastfile with deployment lanes
   - [ ] Test local deployment to internal track

4. **Set up GitHub Actions**
   - [ ] Create deployment workflow
   - [ ] Add all required secrets to repository
   - [ ] Test automated deployment

## Staged Rollout Strategy

1. **Internal Testing** → Deploy to internal track
2. **Beta Testing** → Start with 10% rollout
3. **Production** → Gradually increase: 10% → 25% → 50% → 100%

## References

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [Google Play Console](https://play.google.com/console)
- [Flutter Release Guide](https://flutter.dev/docs/deployment/android)
```

---

## How to Create These Issues

### Using GitHub Web Interface

1. Go to https://github.com/Melampe001/Tokyo-Predictor-Roulette.-/issues/new
2. Copy the title and body from each issue above
3. Add the suggested labels
4. Submit the issue (do not assign anyone)

### Using GitHub CLI

If you have GitHub CLI installed and authenticated:

```bash
# Issue 1
gh issue create \
  --title "Integrate real TokioAI implementation into server" \
  --label "enhancement,server,integration" \
  --body "[paste body from above]"

# Issue 2
gh issue create \
  --title "Add Flutter client integration example (Tokyoapps)" \
  --label "enhancement,documentation,flutter,client" \
  --body "[paste body from above]"

# Issue 3
gh issue create \
  --title "Set up automated Play Store deployment with Fastlane" \
  --label "enhancement,deployment,ci/cd,android" \
  --body "[paste body from above]"
```

---

**Note:** All issues should be created without assignees as per requirements.
