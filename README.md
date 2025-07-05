# JARVIS AI Assistant

A futuristic AI assistant interface inspired by Tony Stark's JARVIS from the Iron Man films. This project features a stunning 3D arc reactor visualization, voice recognition, and AI-powered conversations.

![JARVIS Interface](https://via.placeholder.com/800x400/000000/00d4ff?text=JARVIS+AI+Assistant)

## ✨ Features

- **3D Arc Reactor Visualization**: Interactive arc reactor with dynamic animations and particle effects
- **Voice Recognition**: Speak to JARVIS using your browser's speech recognition
- **AI-Powered Conversations**: Powered by OpenAI's GPT models for intelligent responses
- **Text-to-Speech**: JARVIS speaks back with a sophisticated voice
- **Memory System**: Remembers conversations and learns about user preferences
- **Futuristic UI**: Holographic interface with scanning lines and floating particles
- **Real-time Status**: Live system monitoring and status indicators

## 🚀 Technologies Used

- **React 18** with TypeScript
- **Three.js** & **React Three Fiber** for 3D graphics
- **Framer Motion** for smooth animations
- **Tailwind CSS** for styling
- **OpenAI API** for AI responses
- **Web Speech API** for voice recognition and synthesis
- **Vite** for fast development and building

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (get one at [OpenAI Platform](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jarvis-ai-assistant.git
cd jarvis-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenAI API key:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## 🎮 Usage

1. **Voice Interaction**: Click the microphone button and speak to JARVIS
2. **Text Chat**: Click "Show Chat" to open the text interface
3. **Memory Core**: Click "Memory Core" to view conversation history and user profile
4. **System Status**: Click "System Status" for diagnostics

## 🎨 Features Overview

### Arc Reactor
- Dynamic 3D visualization with multiple rotating rings
- Audio-reactive waveforms in the center
- State-based color changes (idle, listening, thinking, speaking)
- Floating energy particles

### Voice Interface
- Browser-based speech recognition
- Natural language processing via OpenAI
- Text-to-speech with customizable voice settings
- Real-time audio level visualization

### Memory System
- Persistent conversation storage
- User profile building
- Topic analysis and preferences
- Multi-device synchronization

### UI Elements
- Holographic text effects
- Scanning line animations
- Floating particles
- Real-time clock and system status
- Responsive design

## 🔧 Configuration

### Voice Settings
Modify voice parameters in `src/services/OpenAIService.ts`:
```typescript
utterance.rate = 0.9; // Speech speed
utterance.pitch = 0.6; // Voice pitch
utterance.volume = 1.0; // Volume level
```

### Visual Effects
Customize animations in `src/index.css` and component files.

## 📱 Browser Compatibility

- **Chrome**: Full support (recommended)
- **Edge**: Full support
- **Safari**: Full support
- **Firefox**: Limited speech recognition support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Tony Stark's JARVIS from Marvel's Iron Man
- Built with modern web technologies
- OpenAI for providing the AI capabilities

## 🐛 Known Issues

- Speech recognition may not work in all browsers
- Requires HTTPS for voice features in production
- OpenAI API key required for AI responses

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This is a demonstration project. For production use, implement proper API key security and user authentication.