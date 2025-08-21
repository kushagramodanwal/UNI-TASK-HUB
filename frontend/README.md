# UNI TASK HUB - Frontend

A modern React + Vite frontend for UNI TASK HUB, a task swapping platform for university students.

## Features

- 🔐 **Authentication** - Powered by Clerk for secure user management
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Professional black and cyan theme with smooth animations
- 📋 **Task Management** - Post, browse, and manage tasks
- ⭐ **Reviews System** - Rate and review other users
- 🚀 **Fast Performance** - Built with Vite for optimal development experience

## Tech Stack

- **React 19** - Latest React with modern features
- **Vite** - Fast build tool and development server
- **Pure CSS** - Custom styling with professional black and cyan theme
- **React Router v6** - Client-side routing
- **Clerk** - Authentication and user management

## Pages

- **Home** - Overview and call to action
- **Post Task** - Create new tasks (requires authentication)
- **Browse Tasks** - View and filter available tasks
- **My Tasks** - Manage your posted tasks (requires authentication)
- **Reviews** - View and add reviews
- **404** - Not found page for invalid routes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar with auth
│   ├── Footer.jsx      # Footer component
│   ├── TaskCard.jsx    # Task display card
│   └── ReviewCard.jsx  # Review display card
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── PostTask.jsx    # Task creation form
│   ├── BrowseTasks.jsx # Task browsing with filters
│   ├── MyTasks.jsx     # User's task management
│   ├── Reviews.jsx     # Reviews system
│   └── NotFound.jsx    # 404 page
├── utils/              # Helper functions
│   └── api.js          # API utility functions
├── App.jsx             # Main app component with routing
├── main.jsx            # App entry point
└── index.css           # Global styles and theme
```

## Authentication

The app uses Clerk for authentication. Users can:
- Sign up and sign in
- View their profile
- Access protected routes (Post Task, My Tasks)
- Sign out

## Styling

The app uses a custom black and cyan theme with:
- Professional dark design
- Smooth hover effects and animations
- Responsive layout
- Consistent typography and spacing
- Custom CSS components

## API Integration

The frontend is ready for backend API integration. Mock data is currently used for:
- Tasks listing and filtering
- User reviews
- Task management

Replace the mock data with actual API calls when connecting to your backend.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional components with hooks
- Follow React best practices
- Maintain consistent naming conventions
- Add comments for complex logic

## Deployment

The app can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Make sure to set the environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email: unitaskhub@gmail.com
