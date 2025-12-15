# Meal Planning Assistant

An AI-powered meal planning application that helps families create personalized meal plans through conversational onboarding and intelligent recommendations.

## ✨ Features

- **🗣️ Conversational Onboarding**: Quick 4-question setup to understand your household and preferences
- **👥 Household Management**: Support for multiple family members with dietary restrictions
- **🔐 User Authentication**: Secure sign-up and sign-in with Supabase
- **📱 Mobile-First Design**: Bottom navigation tabs for optimal mobile experience
- **🎯 Smart Recommendations**: AI-powered meal suggestions based on your preferences
- **📋 Four Main Sections**:
  - **Home**: Chat interface for onboarding and meal planning
  - **Meal Plan**: Weekly meal calendar (coming soon)
  - **Grocery List**: Auto-generated shopping lists (coming soon)
  - **Profile**: Household and preference management (coming soon)

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for API state management
- **Supabase** for authentication and database
- **Lucide React** for icons

### Backend
- **FastAPI** with Python
- **Supabase** for database and real-time features
- **OpenAI GPT-4** for conversational AI
- **Pydantic** for data validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- OpenAI API key

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys

python main.py
```

The backend API will be available at `http://localhost:8000`

### Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories:

**Backend `.env`:**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

**Frontend `.env`:**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

## 📦 Deployment

### Vercel (Frontend)
1. Connect your GitHub repository to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

### Railway/Render (Backend)
1. Connect your GitHub repository
2. Set **Root Directory** to `backend`
3. Add environment variables
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python main.py`

## 🗂️ Project Structure

```
meal-planning-app/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── tabs/       # Tab components
│   │   │   ├── agents/     # AI chat agents
│   │   │   └── shared/     # Reusable components
│   │   ├── context/        # React Context providers
│   │   ├── lib/           # Utility libraries
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # FastAPI backend
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic
│   ├── models.py           # Data models
│   ├── database.py         # Database configuration
│   ├── chat.py            # AI chat processing
│   ├── main.py            # FastAPI app entry point
│   └── requirements.txt
├── tasks/                  # Development documentation
├── memory-bank/           # Project context and progress
└── README.md
```

## 🔄 Development Workflow

1. **Onboarding Flow**: Users answer 4 questions about their household
2. **Authentication**: Optional account creation after onboarding
3. **Weekly Planning**: AI helps plan meals for the upcoming week
4. **Meal Management**: Drag-and-drop calendar interface (planned)
5. **Grocery Lists**: Auto-generated from meal plans (planned)

## 🎯 Current Status

### ✅ Completed Features
- Four-tab navigation with bottom layout
- Conversational onboarding (4 questions)
- Supabase authentication system
- Basic household profile creation
- AI chat interface with OpenAI integration
- Responsive design with Tailwind CSS

### 🚧 In Development
- Drag-and-drop meal calendar
- Enhanced grocery list management
- Profile editing interface
- PDF export for grocery lists

### 📋 Planned Features
- Recipe recommendations
- Meal plan sharing
- Shopping list optimization
- Nutritional information
- Integration with grocery stores

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- UI components inspired by modern mobile app design
- AI conversations powered by OpenAI GPT-4
- Database and authentication by Supabase

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

*Backend deployed on Railway, Frontend on Vercel*
