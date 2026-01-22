# Language Learning Telegram Bot

A Telegram bot designed to help you practice reading and writing in your target language through AI-powered conversations. Originally built for learning Taiwanese Mandarin, but configurable for any language.

## Features

### Core Conversation
- **Natural AI Conversations**: Chat with an AI tutor that adapts to your learning level
- **Delayed Responses**: Mimics real texting with 1-60 minute delays for a natural feel (toggle with `/instant`)
- **Voice Message Support**: Send voice memos and get transcriptions + responses
- **Multi-Provider AI**: Choose between OpenAI (GPT-4) or Google Gemini

### Learning Tools
- **Pinyin Generation**: Get pinyin for any Chinese text with `/pinyin` command or by replying "pinyin"
- **Translations**: Get detailed word-by-word translations with `/translate`
- **Pronunciation**: Get audio pronunciation of text using TTS with `/pronounce`
- **Daily Word**: Receive a new vocabulary word every day at your scheduled time

### Reference Materials
- **Tutor Notes**: Load your tutor's notes (from Preply, etc.) for personalized context
- **Lesson Slides**: Import PowerPoint presentations from your lessons
- **Documents**: Support for .txt, .md, .docx, .pdf files

### Reply Features
Reply to any bot message with these keywords for quick actions:
- `pinyin` or `拼音` - Get pinyin romanization
- `translate` or `翻译` - Get translation and breakdown
- `pronounce` or `发音` - Get audio pronunciation

## Quick Start

### Prerequisites
- Node.js 18+ (or Docker)
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))
- OpenAI API Key or Google Gemini API Key

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-language-chatter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Add reference materials** (optional)
   ```bash
   # Add your tutor notes, lesson slides, etc. to:
   ./reference-materials/
   ```

5. **Start the bot**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

### Docker Deployment

#### Simple (without MySQL)
```bash
docker-compose -f docker-compose.simple.yml up -d
```

#### With MySQL (for conversation history)
```bash
docker-compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | *required* |
| `TELEGRAM_USER_ID` | Your Telegram user ID (for daily words) | - |
| `RESTRICT_TO_ALLOWED_USERS` | Restrict bot to allowed users only | `false` |
| `ALLOWED_USER_IDS` | Comma-separated list of allowed user IDs | - |
| `AI_PROVIDER` | `openai` or `gemini` | `gemini` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.0-flash` |
| `GEMINI_TTS_MODEL` | Gemini TTS model | `gemini-2.5-pro-preview-tts` |
| `TARGET_LANGUAGE` | Language you're learning | `Taiwanese Mandarin` |
| `NATIVE_LANGUAGE` | Your native language | `English` |
| `LEARNING_LEVEL` | `beginner`, `intermediate`, `advanced` | `beginner` |
| `RESPONSE_DELAY_MIN` | Minimum response delay (seconds) | `60` |
| `RESPONSE_DELAY_MAX` | Maximum response delay (seconds) | `3600` |
| `DAILY_WORD_CRON` | Cron schedule for daily word | `0 9 * * *` |
| `TIMEZONE` | Timezone for scheduling | `America/New_York` |
| `USE_DATABASE` | Enable MySQL storage | `false` |
| `MYSQL_HOST` | MySQL host | `localhost` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | MySQL username | `language_bot` |
| `MYSQL_PASSWORD` | MySQL password | - |
| `MYSQL_DATABASE` | MySQL database name | `language_chatter` |
| `REFERENCE_MATERIALS_DIR` | Path to reference materials | `./reference-materials` |
| `DEBUG` | Enable debug logging | `false` |

### Getting Your Telegram User ID
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your user ID
3. Add this to `TELEGRAM_USER_ID` in your `.env`

### User Access Control

By default, the bot is open to anyone who messages it. To restrict access to specific users:

```env
# Enable restriction
RESTRICT_TO_ALLOWED_USERS=true

# Your user ID (automatically allowed when restriction is enabled)
TELEGRAM_USER_ID=123456789

# Additional allowed users (comma-separated)
ALLOWED_USER_IDS=987654321,456789123
```

When restriction is enabled:
- Only users in `ALLOWED_USER_IDS` or `TELEGRAM_USER_ID` can interact with the bot
- Unauthorized users receive a polite rejection message
- All unauthorized access attempts are logged

This is recommended for public repositories to prevent unauthorized API usage.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and get a welcome message |
| `/help` | Show all available commands |
| `/pinyin` | Get pinyin for the last bot message |
| `/translate` | Get translation of the last bot message |
| `/pronounce` | Get audio pronunciation of the last bot message |
| `/word` | Get today's word of the day |
| `/level` | Check or change your learning level |
| `/instant` | Toggle instant responses (no delay) |
| `/status` | Show bot status and configuration |

## Reference Materials

Add your learning materials to the `reference-materials/` directory:

```
reference-materials/
├── tutor-notes/
│   ├── lesson-1.txt
│   ├── lesson-2.md
│   └── vocabulary.txt
├── presentations/
│   ├── unit-1.pptx
│   └── unit-2.pptx
└── documents/
    └── grammar-guide.pdf
```

### Supported Formats
- **Text files**: `.txt`, `.md`
- **PowerPoint**: `.pptx`, `.ppt`
- **Word documents**: `.docx`, `.doc`
- **PDF**: `.pdf`

The bot will automatically parse and use these materials to personalize conversations and vocabulary suggestions.

## Deployment

### Railway

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy!

For MySQL, add a MySQL plugin from the Railway dashboard.

### Heroku

1. Create a new Heroku app
2. Set environment variables via Heroku CLI or dashboard:
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   heroku config:set AI_PROVIDER=gemini
   heroku config:set GEMINI_API_KEY=your_key
   # ... other variables
   ```
3. Deploy:
   ```bash
   git push heroku main
   ```

### VPS / Self-Hosted

1. Clone the repository to your server
2. Install Node.js 18+
3. Configure `.env`
4. Run with PM2:
   ```bash
   npm install -g pm2
   npm run build
   pm2 start dist/index.js --name language-bot
   pm2 save
   ```

## Learning Levels

The bot adjusts its responses based on your level:

| Level | Description |
|-------|-------------|
| **Beginner** | Simple vocabulary, pinyin with all new words, basic sentence structures, frequent translations |
| **Intermediate** | More complex sentences, pinyin only for difficult words, less hand-holding |
| **Advanced** | Natural conversations like a native speaker, minimal pinyin, challenging vocabulary |

Change your level anytime with `/level [beginner/intermediate/advanced]`

## Recommended Models by Language

Different AI models have varying strengths for different languages. Here are our recommendations:

### Chinese (Mandarin/Taiwanese Mandarin/Cantonese)

| Provider | Model | Notes |
|----------|-------|-------|
| **Gemini** | `gemini-2.0-flash` | Excellent for Chinese, fast responses, good cultural context |
| **Gemini** | `gemini-2.5-pro-preview-tts` | Best TTS for Mandarin pronunciation |
| **OpenAI** | `gpt-4o` | Strong Chinese ability, excellent explanations |
| OpenAI | `gpt-4o-mini` | Budget option, still good for basic conversations |

**Recommended setup for Mandarin:**
```env
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TTS_MODEL=gemini-2.5-pro-preview-tts
```

### Japanese

| Provider | Model | Notes |
|----------|-------|-------|
| **Gemini** | `gemini-2.0-flash` | Excellent kanji/hiragana/katakana handling |
| **OpenAI** | `gpt-4o` | Strong Japanese, good at explaining grammar |
| OpenAI | `gpt-4o-mini` | Decent for casual practice |

**Recommended setup for Japanese:**
```env
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.0-flash
TARGET_LANGUAGE=Japanese
```

### Korean

| Provider | Model | Notes |
|----------|-------|-------|
| **Gemini** | `gemini-2.0-flash` | Good Hangul support, natural conversations |
| **OpenAI** | `gpt-4o` | Strong Korean, excellent grammar explanations |

**Recommended setup for Korean:**
```env
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o
TARGET_LANGUAGE=Korean
```

### Spanish / Portuguese / French / Italian

| Provider | Model | Notes |
|----------|-------|-------|
| **OpenAI** | `gpt-4o` | Excellent for Romance languages |
| **OpenAI** | `gpt-4o-mini` | Great budget option, very capable |
| Gemini | `gemini-2.0-flash` | Good alternative, fast responses |

**Recommended setup for Spanish:**
```env
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
TARGET_LANGUAGE=Spanish
```

### German / Dutch / Nordic Languages

| Provider | Model | Notes |
|----------|-------|-------|
| **OpenAI** | `gpt-4o` | Strong Germanic language support |
| Gemini | `gemini-2.0-flash` | Good alternative |

### Arabic / Hebrew / Farsi

| Provider | Model | Notes |
|----------|-------|-------|
| **OpenAI** | `gpt-4o` | Best RTL language support |
| Gemini | `gemini-2.0-flash` | Capable but OpenAI edges ahead |

### Russian / Ukrainian / Other Slavic

| Provider | Model | Notes |
|----------|-------|-------|
| **OpenAI** | `gpt-4o` | Excellent Cyrillic support |
| **Gemini** | `gemini-2.0-flash` | Also very capable |

### Hindi / Thai / Vietnamese / Other Asian Languages

| Provider | Model | Notes |
|----------|-------|-------|
| **Gemini** | `gemini-2.0-flash` | Generally better for less common Asian languages |
| OpenAI | `gpt-4o` | Good but Gemini often has edge |

### TTS (Text-to-Speech) Recommendations

For pronunciation features (`/pronounce`), TTS quality varies by language:

| Language | Best Provider | Model | Notes |
|----------|---------------|-------|-------|
| Chinese (Mandarin) | Gemini | `gemini-2.5-pro-preview-tts` | Excellent tones |
| Japanese | Gemini | `gemini-2.5-pro-preview-tts` | Natural pitch accent |
| Korean | Gemini | `gemini-2.5-pro-preview-tts` | Good pronunciation |
| European Languages | OpenAI | `tts-1` | Very natural |
| Spanish | OpenAI | `tts-1` | Excellent |
| French | OpenAI | `tts-1` | Very natural |
| German | OpenAI | `tts-1` | Good quality |

**Note:** If using OpenAI for TTS, the bot automatically uses OpenAI's TTS API. Gemini TTS requires the `gemini-2.5-pro-preview-tts` model.

### Cost Considerations

| Model | Relative Cost | Best For |
|-------|---------------|----------|
| `gpt-4o-mini` | $ | Budget learning, high-volume practice |
| `gemini-2.0-flash` | $ | Fast responses, good quality |
| `gpt-4o` | $$$ | Complex grammar, detailed explanations |
| `gemini-2.5-pro` | $$$$ | Advanced features, best quality |

For most learners, `gemini-2.0-flash` or `gpt-4o-mini` provides excellent value.

## Architecture

```
src/
├── index.ts              # Entry point
├── bot.ts                # Bot setup and lifecycle
├── config.ts             # Configuration management
├── ai/
│   ├── index.ts          # AI provider factory
│   ├── types.ts          # Type definitions
│   ├── openai.ts         # OpenAI implementation
│   └── gemini.ts         # Gemini implementation
├── commands/
│   ├── index.ts          # Command exports
│   ├── help.ts           # /help command
│   ├── pinyin.ts         # /pinyin command
│   ├── translate.ts      # /translate command
│   ├── pronounce.ts      # /pronounce command
│   ├── word.ts           # /word command
│   ├── level.ts          # /level command
│   ├── instant.ts        # /instant command
│   └── status.ts         # /status command
├── handlers/
│   ├── index.ts          # Handler exports
│   ├── message.ts        # Text message handler
│   ├── voice.ts          # Voice message handler
│   └── reply.ts          # Reply handler
├── services/
│   ├── context.ts        # Conversation context management
│   ├── delay.ts          # Response delay service
│   ├── materials.ts      # Reference materials parser
│   └── scheduler.ts      # Daily word scheduler
├── database/
│   └── index.ts          # MySQL database layer
└── utils/
    └── pinyin.ts         # Pinyin utilities
```

## Troubleshooting

### Bot not responding
- Check that `TELEGRAM_BOT_TOKEN` is correct
- Ensure the AI provider API key is valid
- Check the console for error messages

### No audio for /pronounce
- TTS requires Gemini with the TTS model
- Verify `GEMINI_TTS_MODEL` is set correctly
- Check that your Gemini API has TTS access

### Reference materials not loading
- Verify file formats are supported
- Check file permissions
- Look for parsing errors in console logs

### Database connection issues
- Ensure MySQL is running
- Verify connection credentials
- Check that the database exists

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [OpenAI](https://openai.com/) - AI/LLM Provider
- [Google Gemini](https://ai.google.dev/) - AI/LLM Provider
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) - Chinese Pinyin Library
