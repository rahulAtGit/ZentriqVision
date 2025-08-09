# ZentriqVision Mobile App

A React Native + Expo mobile application for video surveillance AI processing.

## 🚀 Features

- **Video Upload**: Upload surveillance videos for AI processing
- **Search & Filter**: Search for people and objects with advanced filters
- **Video Playback**: Watch videos with detection overlays
- **Real-time Processing**: AI-powered video analysis
- **Modern UI**: Beautiful, intuitive interface

## 📱 Screens

1. **Dashboard** - Main overview with quick actions
2. **Authentication** - Sign in/Sign up with email
3. **Upload** - Video upload with progress tracking
4. **Search** - Advanced search with filters
5. **Playback** - Video playback with detection details

## 🛠 Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **UI Components**: React Native Elements + Ionicons
- **Video**: Expo AV
- **Image Picker**: Expo Image Picker
- **HTTP Client**: React Query
- **TypeScript**: Full type safety

## 🏗 Project Structure

```
mobile-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Dashboard
│   ├── auth.tsx           # Authentication
│   ├── upload.tsx         # Video upload
│   ├── search.tsx         # Search & filters
│   └── playback/          # Video playback
│       └── [videoId].tsx  # Dynamic video playback
├── components/            # Reusable components
├── hooks/                 # Custom hooks
│   └── useAuthStore.ts    # Authentication store
├── services/              # API services
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 📊 State Management

### Authentication Store (Zustand)

```typescript
interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, givenName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

## 🎨 UI Components

### Design System

- **Colors**: iOS-style color palette
- **Typography**: System fonts with consistent sizing
- **Spacing**: 8px grid system
- **Shadows**: Subtle elevation for cards
- **Border Radius**: 12px for cards, 8px for buttons

### Key Components

- **Cards**: Consistent card design with shadows
- **Buttons**: Primary and secondary button styles
- **Inputs**: Styled text inputs with icons
- **Icons**: Ionicons for consistent iconography

## 🔗 API Integration

### Endpoints

- `POST /upload` - Video upload with presigned URL
- `GET /search` - Search videos and detections
- `GET /videos/{videoId}` - Get video details

### Authentication

- JWT-based authentication
- Secure token storage
- Automatic token refresh

## 📱 Platform Support

- ✅ iOS (13+)
- ✅ Android (API 21+)
- ✅ Web (Chrome, Safari, Firefox)

## 🔧 Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Consistent naming conventions

### Testing

- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox (planned)

## 🚀 Deployment

### Expo Build

1. **Configure app.json**:
   ```json
   {
     "expo": {
       "name": "ZentriqVision",
       "slug": "zentriqvision",
       "version": "1.0.0"
     }
   }
   ```

2. **Build for production**:
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

### App Store Deployment

1. **iOS App Store**:
   - Configure certificates and provisioning profiles
   - Submit through App Store Connect

2. **Google Play Store**:
   - Generate signed APK/AAB
   - Submit through Google Play Console

## 🔒 Security

- Secure token storage with Expo SecureStore
- HTTPS-only API calls
- Input validation and sanitization
- Privacy-first design

## 📈 Performance

- Lazy loading for screens
- Image optimization
- Efficient state management
- Memory leak prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team
