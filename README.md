# SkillMarket India

A real-time, gamified platform where students and professionals can trade skills and job roles like stocks using virtual currency (JobCoins). The platform simulates market demand to help users understand which skills are most valuable in the Indian job market.

## Problem Statement

Students in India often don't know which skills or job roles are actually in demand. Existing sources are outdated or biased. SkillMarket India provides a real-time, market-driven solution where demand is determined by actual user trading activity.

## Solution

SkillMarket India is a full-stack trading platform that allows users to buy and sell skills using virtual currency. Prices fluctuate based on supply and demand, providing real-time insights into skill popularity and market trends.

## Features

### Core Features

- **Authentication System**: Email/password signup and login with JWT-based authentication
- **Starting Capital**: Each new user receives 10,000 JobCoins (JC) to start trading
- **Skills Market**: 15 predefined skills including AI/ML Engineer, Full Stack Developer, React Developer, DevOps Engineer, and more
- **Real-Time Trading**: Buy and sell skills with instant price updates based on trading volume
- **Dynamic Pricing**: Prices adjust automatically based on buy/sell activity using the formula: `price = price + (buyVolume - sellVolume) * factor`
- **Wallet System**: Track your balance, holdings, and profit/loss in real-time
- **Leaderboard**: Compete with other traders and see who's making the most profit
- **Referral System**: Earn rewards by inviting friends (1000 JC for referrer, 500 JC for referee after first trade)
- **Price History**: Visual charts showing price trends over time
- **Real-Time Updates**: Live price updates using Supabase realtime subscriptions

### User Experience

- Clean, modern UI inspired by professional trading platforms
- Fully responsive design (mobile and desktop)
- Smooth animations and transitions
- Intuitive navigation with sticky navbar
- Real-time balance updates
- Visual feedback for all actions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase Client** for authentication and real-time data

### Backend
- **Supabase** (PostgreSQL database)
- **Supabase Edge Functions** (Deno runtime)
- **Row Level Security (RLS)** for data protection
- **PostgreSQL Functions & Triggers** for automated workflows

### Architecture

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         ├──── Supabase Auth (JWT)
         │
         ├──── Supabase Database (PostgreSQL)
         │     ├── profiles
         │     ├── skills
         │     ├── trades
         │     ├── holdings
         │     ├── price_history
         │     └── referral_rewards
         │
         └──── Supabase Edge Functions
               ├── execute-trade
               └── leaderboard
```

## Database Schema

### Tables

1. **profiles**: User profiles with balance and referral codes
2. **skills**: Available skills with current prices and trading volumes
3. **trades**: Complete trade history for all users
4. **holdings**: User portfolios showing owned skills
5. **price_history**: Historical price data for charts
6. **referral_rewards**: Tracking referral bonuses

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Skills and leaderboard data are publicly readable
- Service role used for secure server-side operations

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillmarket-india
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   The `.env` file already contains your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**

   The database schema and initial seed data have already been applied through migrations:
   - `create_skillmarket_schema`: Creates all tables, indexes, RLS policies, and triggers
   - `seed_initial_skills`: Populates 15 initial skills with starting prices

5. **Edge Functions**

   The following Edge Functions are already deployed:
   - `execute-trade`: Handles all buy/sell transactions
   - `leaderboard`: Calculates and returns top traders

### Running the Application

1. **Development mode**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Preview production build**
   ```bash
   npm run preview
   ```

4. **Type checking**
   ```bash
   npm run typecheck
   ```

5. **Linting**
   ```bash
   npm run lint
   ```

## How It Works

### Trading Mechanism

1. **Buying**: Users spend JobCoins to acquire skill units. Price increases with buy volume.
2. **Selling**: Users sell held skills back to the market. Price decreases with sell volume.
3. **Price Calculation**: `new_price = current_price + (quantity * 0.01)` for buys, negative for sells
4. **Portfolio**: Holdings tracked with average buy price for P&L calculation

### Referral System

1. User A shares their referral code
2. User B signs up using the code
3. After User B's first trade:
   - User A receives 1000 JC
   - User B receives 500 JC
4. Rewards are automatic and instant

### Leaderboard Ranking

Users are ranked by total profit calculated as:
```
Total Wealth = Cash Balance + Portfolio Value
Profit = Total Wealth - 10000 (starting capital)
```

## API Endpoints (Edge Functions)

### Execute Trade
- **URL**: `/functions/v1/execute-trade`
- **Method**: POST
- **Auth**: Required (JWT Bearer token)
- **Body**:
  ```json
  {
    "skillId": "uuid",
    "type": "buy" | "sell",
    "quantity": number
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "newBalance": number,
    "newPrice": number,
    "message": string
  }
  ```

### Leaderboard
- **URL**: `/functions/v1/leaderboard`
- **Method**: GET
- **Auth**: Required
- **Response**:
  ```json
  {
    "leaderboard": [
      {
        "userId": "uuid",
        "email": "string",
        "balance": number,
        "portfolioValue": number,
        "totalWealth": number,
        "profit": number,
        "profitPercentage": "string"
      }
    ]
  }
  ```

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   └── Layout/
│       └── Navbar.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── SkillDetail.tsx
│   ├── Wallet.tsx
│   ├── Leaderboard.tsx
│   └── Profile.tsx
├── App.tsx
├── main.tsx
└── index.css

supabase/
└── functions/
    ├── execute-trade/
    │   └── index.ts
    └── leaderboard/
        └── index.ts
```

## Key Features Explained

### Real-Time Price Updates

The application uses Supabase's real-time subscriptions to update prices instantly when trades occur:

```typescript
const channel = supabase
  .channel('skills-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => {
    fetchSkills();
  })
  .subscribe();
```

### Authentication Flow

1. User signs up with email/password and optional referral code
2. Supabase trigger automatically creates profile with 10,000 JC
3. Unique referral code generated for each user
4. JWT token manages session state

### Price Chart Visualization

SVG-based line charts show price history with gradient fills, automatically scaling to show price ranges effectively.

## Security Best Practices

- Passwords hashed with bcrypt automatically by Supabase Auth
- JWT tokens for stateless authentication
- Row Level Security prevents unauthorized data access
- Input validation on all trade operations
- Service role key used only in Edge Functions (server-side)
- CORS headers properly configured for cross-origin requests

## Performance Optimizations

- Database indexes on frequently queried columns
- Real-time subscriptions instead of polling
- Efficient SQL queries with proper joins
- Memoization of expensive calculations
- Optimized bundle size with Vite

## Future Enhancements

- Real historical data integration
- Advanced charting with technical indicators
- Social features (following traders, forums)
- Portfolio analytics and insights
- Mobile apps (iOS/Android)
- Limit orders and stop-loss features
- Skill categories and filtering
- News feed affecting skill prices

## Troubleshooting

### Common Issues

1. **Edge Functions not working**: Ensure Supabase URL and keys are correct in `.env`
2. **Real-time updates not working**: Check browser console for WebSocket connection issues
3. **Authentication errors**: Clear browser cache and local storage
4. **Build errors**: Run `npm install` again and ensure Node.js version is 18+

### Support

For issues or questions, check:
- Supabase documentation: https://supabase.com/docs
- Vite documentation: https://vitejs.dev
- React documentation: https://react.dev

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Contributing

Contributions welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Built with Supabase for backend infrastructure
- UI inspired by modern trading platforms
- Icons from Lucide React
- Styled with Tailwind CSS

---

**SkillMarket India** - Trade Skills. Build Your Future.
