# Universal Translator App

A cross-platform mobile app for iOS and Android that provides real-time language translation with advanced features for travelers.

## Features

### Core Translation Features
- Translate text between multiple languages
- Swap languages with a single tap
- Save translation history for quick reference
- Customizable settings
- Dark mode support

### Offline Capabilities
- Download language packs for offline use
- Choose between different quality levels based on your storage needs
- Offline translation works without an internet connection
- Ideal for international travel with limited connectivity

### Real-time Conversation
- Two-way conversation translation
- Each person speaks in their native language
- Seamless translation displayed on the screen
- Voice recognition for hands-free translation
- Essential for face-to-face communication

### Visual Translation
- Translate text from images and photos
- Take a photo or select from your gallery
- OCR technology recognizes text from images
- Perfect for menus, signs, and documents
- Overlay mode shows translations in context

### Smart Context-Aware Translation
- Improved translation accuracy based on context
- Categories for restaurants, transportation, hotels, etc.
- Better translations for common travel scenarios
- Natural-sounding results beyond word-for-word translation

### Travel Phrasebook
- Quick access to common travel phrases
- Categorized by situation (restaurants, transportation, etc.)
- Save your own custom phrases for quick access
- Audio pronunciation to help you learn key phrases

## Screenshots

(Screenshots will be added here after the app is built)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional for development)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/translator-app.git
cd translator-app
```

2. Install dependencies:
```
npm install
```
or
```
yarn install
```

3. Start the development server:
```
npm start
```
or
```
yarn start
```

4. Follow the instructions in the terminal to open the app on your device or emulator.

### Running on a Physical Device

1. Install the Expo Go app on your iOS or Android device.
2. Scan the QR code displayed in the terminal or Expo DevTools.
3. The app will open in the Expo Go app.

## Tech Stack

- **Core Framework**: React Native and Expo
- **Navigation**: React Navigation with native stack navigation
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Storage**:
  - AsyncStorage for local data persistence
  - Expo FileSystem for language pack storage
- **UI Components**:
  - Custom components for reusability
  - React Native Dropdown Picker for language selection
  - Ionicons for consistent iconography
- **Networking**:
  - Axios for API requests (in production version)
  - NetInfo for network connectivity detection
- **Media Handling**:
  - Expo Camera for visual translation
  - Expo ImagePicker for gallery access
- **Offline Capabilities**:
  - Custom offline service for language pack management
  - Simulated offline translation engine
- **Voice & Speech**:
  - Expo Speech for text-to-speech
  - Voice recognition for conversation mode
- **Internationalization**:
  - i18n-js for localization support
  - Expo Localization for device language detection

## Project Structure

```
translator-app/
├── App.js                       # Main application component with navigation
├── package.json                 # Node.js dependencies
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── LanguageSelector.js  # Language selection component
│   │   └── TranslationResult.js # Translation output component
│   ├── screens/                 # Screen components
│   │   ├── HomeScreen.js             # Welcome screen with feature access
│   │   ├── TranslateScreen.js        # Text translation interface
│   │   ├── HistoryScreen.js          # Translation history
│   │   ├── SettingsScreen.js         # User settings
│   │   ├── ConversationScreen.js     # Real-time conversation interface
│   │   ├── ConversationListScreen.js # Saved conversations list
│   │   ├── CameraTranslateScreen.js  # Camera-based translation
│   │   ├── PhrasebookScreen.js       # Travel phrasebook
│   │   └── LanguagePacksScreen.js    # Offline language management
│   ├── services/                # Business logic and API services
│   │   ├── translationService.js      # Translation API wrapper
│   │   ├── historyService.js          # History management
│   │   ├── settingsService.js         # User settings management
│   │   ├── offlineService.js          # Offline mode and language packs
│   │   ├── conversationService.js     # Conversation management
│   │   ├── phrasebookService.js       # Phrasebook management
│   │   └── cameraTranslationService.js # Camera and image translation
│   └── utils/                   # Utility functions
│       └── themeUtils.js        # Theme management for dark/light mode
└── assets/                      # Images, fonts, etc.
```

## Adding a New Language

To add support for a new language:

1. Add the language to the `languages` array in `src/screens/TranslateScreen.js`
2. Add any necessary language-specific translations in `src/services/translationService.js`

## API Integration

This demo app uses mock translations, but it's designed to be easily integrated with real translation APIs:

1. Update the `translateText` function in `src/services/translationService.js` with your preferred API
2. Add your API key to the settings screen

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/translator-app](https://github.com/yourusername/translator-app)# translaor-mobile-app
