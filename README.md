# 🧊 Icebreaker - LinkedIn Profile Analyzer & AI Icebreaker Generator

A modern, legally compliant web application that generates personalized icebreakers using LinkedIn profile data through official API integration. Built with React, TypeScript, Node.js, and AI-powered analysis.

## ✨ Features

### 🔐 **Legal & Secure LinkedIn Integration**
- **OAuth Authentication**: Secure LinkedIn login using official API
- **No Scraping**: Fully compliant with LinkedIn's Terms of Service
- **Session-Based Security**: Temporary token storage with automatic cleanup
- **User Consent**: Users maintain full control over their data

### 🤖 **AI-Powered Analysis**
- **Profile Summarization**: Intelligent analysis of professional background
- **Personalized Icebreakers**: Generate 5 unique conversation starters
- **Context-Aware**: Considers experience, education, skills, and interests
- **Google Gemini Integration**: Advanced natural language processing

### 🎯 **LinkedIn-Focused Analysis**
- **LinkedIn API**: Fetch data directly from authenticated LinkedIn profiles
- **Manual Input**: Alternative form-based input for LinkedIn profile data
- **Comprehensive Analysis**: Deep insights from professional LinkedIn profiles

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark/Light Theme**: Automatic theme switching
- **Real-time Feedback**: Loading states, error handling, and success notifications
- **Professional Interface**: Clean, intuitive design built with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- LinkedIn Developer Account (for OAuth setup)
- Google AI API Key (for icebreaker generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd icebreaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # LinkedIn OAuth Configuration
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   LINKEDIN_CALLBACK_URL=http://localhost:5000/api/linkedin/callback
   
   # Session Configuration
   SESSION_SECRET=your-secure-session-secret
   
   # Google AI Configuration
   GOOGLE_API_KEY=your-google-api-key
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **LinkedIn App Setup**
   - Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
   - Create a new app
   - Add redirect URL: `http://localhost:5000/api/linkedin/callback`
   - Request scopes: `r_liteprofile`, `r_emailaddress`
   - Copy Client ID and Secret to your `.env` file

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 📖 Usage Guide

### LinkedIn API Method (Recommended)

1. **Navigate to LinkedIn Integration**
   - Visit `http://localhost:5173/linkedin`
   - Click "Sign in with LinkedIn"

2. **Authorize Access**
   - Complete LinkedIn OAuth flow
   - Grant permissions for profile access

3. **Generate Icebreakers**
   - Click "Generate Icebreakers"
   - View AI-generated profile summary and conversation starters

### Manual Input Method

1. **Choose Manual Entry**
   - Click "Enter Manually" on the LinkedIn page
   - Fill out the profile form with your information

2. **Submit Profile Data**
   - Enter name, headline, experience, education, and skills
   - Click "Generate Icebreakers"

3. **Review Results**
   - View personalized icebreakers based on your input

## 🏗️ Architecture

### Backend (`/api`)
- **Express.js Server**: RESTful API with TypeScript
- **Passport.js**: OAuth authentication middleware
- **LinkedIn Service**: Official API integration
- **AI Service**: Google Gemini integration for icebreaker generation
- **Session Management**: Secure token handling

### Frontend (`/src`)
- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Sonner**: Toast notifications

### Key API Endpoints
```
GET  /api/linkedin/auth              # Initiate OAuth
GET  /api/linkedin/callback          # OAuth callback
GET  /api/linkedin/profile           # Fetch profile data
POST /api/linkedin/generate-icebreakers  # Generate from LinkedIn
POST /api/linkedin/manual-icebreakers    # Generate from manual input
GET  /api/linkedin/status            # Check auth status
POST /api/linkedin/logout            # Clear session
```

## 🔒 Legal Compliance & Privacy

### LinkedIn Terms Compliance
- ✅ **Official API Only**: No web scraping or unauthorized data access
- ✅ **User Consent**: Explicit OAuth authorization required
- ✅ **Scope Limitation**: Only accesses permitted profile fields
- ✅ **Temporary Storage**: No permanent data retention
- ✅ **Transparent Usage**: Clear privacy notices and data handling

### Data Handling
- **Session-Based**: Tokens stored temporarily in server sessions
- **No Persistence**: Profile data not saved to databases
- **User Control**: Users can logout and revoke access anytime
- **Minimal Scope**: Only requests necessary LinkedIn permissions

### Security Measures
- **HTTPS Required**: Secure communication in production
- **Session Secrets**: Cryptographically secure session management
- **Input Validation**: Sanitized user inputs and API responses
- **Error Handling**: Graceful failure without data exposure

## 🛠️ Development

### Project Structure
```
icebreaker/
├── api/                    # Backend Express server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── app.ts            # Express app configuration
├── src/                   # Frontend React app
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route components
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── .env.example          # Environment template
└── package.json          # Dependencies and scripts
```

### Available Scripts
```bash
npm run dev          # Start development servers
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Adding New Features
1. **Backend**: Add routes in `/api/routes/`
2. **Frontend**: Create components in `/src/components/`
3. **Services**: Add business logic in `/api/services/`
4. **Types**: Define interfaces in TypeScript files

## 🔧 Configuration

### LinkedIn API Scopes
- `r_liteprofile`: Basic profile information (name, headline, profile picture)
- `r_emailaddress`: Email address access
- Additional scopes can be requested based on LinkedIn's available permissions

### AI Configuration
- **Model**: Google Gemini Pro
- **Context**: Professional networking and conversation starters
- **Output**: Structured JSON with summary and icebreaker array

## 🚨 Troubleshooting

### Common Issues

**LinkedIn OAuth Errors**
- Verify redirect URL matches LinkedIn app configuration
- Check client ID and secret in `.env` file
- Ensure app is approved for production use

**API Rate Limits**
- LinkedIn API has rate limits per application
- Implement proper error handling for 429 responses
- Consider caching strategies for production

**Session Issues**
- Verify session secret is set and secure
- Check cookie settings for your domain
- Clear browser cookies if authentication fails

### Error Codes
- `401`: Authentication required or expired
- `403`: Insufficient LinkedIn permissions
- `429`: Rate limit exceeded
- `500`: Server error or AI service unavailable

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues, questions, or feature requests:
- Create an issue in the project repository
- Check existing documentation
- Review LinkedIn API documentation for OAuth setup

---

**⚠️ Important Legal Notice**: This application uses LinkedIn's official API and complies with their Terms of Service. It does not perform web scraping or unauthorized data access. Users must provide explicit consent through OAuth before any profile data is accessed.
