# Real-time Transcription App

A Next.js application for real-time audio transcription using the Web Speech API with support for both Gemini and OpenAI's APIs.

## Features

- Real-time speech-to-text transcription
- Support for multiple languages
- Clean, responsive UI with Tailwind CSS
- Built with Next.js and React
- TypeScript support
- Testing with Jest
- Dual AI backend support (Gemini and OpenAI)

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key (for advanced transcription features)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/rt-transcribe.git
   cd rt-transcribe
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your API keys (choose either Gemini or OpenAI or both):
   ```
   # Required for Gemini
   GOOGLE_API_KEY=your_google_api_key_here
   GEMINI_MODEL=gemini-pro  # Optional, defaults to 'gemini-pro'
   
   # Required for OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint

## AI Backend Configuration

### Using Gemini (Recommended)
1. Get your Google API key from [Google AI Studio](https://makersuite.google.com/)
2. Add it to your `.env.local`:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   GEMINI_MODEL=gemini-pro  # Optional
   ```

### Using OpenAI
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to your `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Switching Between Backends
Update your code to import from the desired module:

```typescript
// For Gemini (recommended)
import { genAI, chooseTextModel } from '../lib/gemini';

// For OpenAI (legacy)
// import { openai } from '../lib/openai';
```

## Project Structure

```
rt-transcribe/
├── .github/           # GitHub Actions workflows
├── public/            # Static files
├── src/
│   ├── app/           # Next.js 13+ app directory
│   ├── components/     # React components
│   ├── lib/           # AI and utility functions
│   │   ├── gemini.ts  # Gemini implementation
│   │   └── openai.ts  # OpenAI implementation (legacy)
│   └── styles/        # Global styles
├── __tests__/         # Test files
├── .eslintrc.json     # ESLint configuration
├── .gitignore
├── jest.config.js     # Jest configuration
├── next.config.js     # Next.js configuration
├── package.json
├── postcss.config.js  # PostCSS configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## Testing

Run the test suite:
```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## Deployment

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Gemini](https://ai.google.dev/)
- [OpenAI](https://openai.com/)
