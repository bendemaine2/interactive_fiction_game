# Dream Fiction

A generative interactive fiction experience where you co-create a living world with AI in real time.

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Local Development

1. Clone the repo and install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the project root:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add `ANTHROPIC_API_KEY` as an environment variable in project settings
4. Deploy — you'll get a shareable `.vercel.app` URL

## How It Works

- **Story Mode**: Play inside the world. Talk to characters, make choices, watch the narrative unfold.
- **World-Building Mode**: Step outside to reshape characters, settings, and tone.
- **Wackiness Slider**: Controls how grounded or surreal the world feels (0-100).

Built with Next.js, TypeScript, Tailwind CSS, and Claude Sonnet.
