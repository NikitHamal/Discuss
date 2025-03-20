# Storm Write Community Forum

A modern, responsive web application for discussions and debates on religion, spirituality, philosophy, and related topics. The platform features a clean, intuitive UI inspired by popular community forums like Reddit, Stack Overflow, and modern community platforms.

## Features

- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices
- **Modern UI**: Clean layout with custom theme options and Poppins font
- **Dark Mode**: Toggle between light and dark themes, with auto-detect system preference
- **Custom Themes**: Choose from multiple theme options (Philosophical, Science, Nature, Cyberpunk, Minimal)
- **User Authentication**: Complete login/signup system with Firebase Authentication
- **Interactive Elements**: Voting system, comment threads, and post interactions
- **Category Filtering**: Browse discussions by topic category
- **Post Creation**: Start new discussions with rich formatting options
- **User Profiles**: Customize user profiles with avatars and personal information
- **Settings Panel**: Personalize your experience with various customization options
- **Notifications**: Stay updated with an integrated notification system
- **Mobile-Friendly Navigation**: Collapsible menu for smaller screens
- **Music Generator**: AI-powered ambient music creator for focus and meditation

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (with CSS variables, Flexbox/Grid layouts)
  - JavaScript (ES6+)
  - Material Icons
  - Google Fonts (Poppins)
  
- **Backend**:
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Storage
  - Firebase Analytics

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser to view the application
3. For full functionality, you'll need to connect to Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage services
   - Replace the Firebase config in `js/firebase-config.js` with your own

## Project Structure

```
storm-write/
├── css/
│   ├── styles.css (Main styles)
│   ├── auth.css (Authentication pages)
│   ├── post-detail.css
│   ├── profile.css
│   ├── write.css
│   ├── topics.css
│   ├── about.css
│   ├── faq.css
│   ├── terms.css
│   ├── privacy.css
│   └── notifications.css
├── js/
│   ├── main.js (Core functionality)
│   ├── firebase-config.js (Firebase integration)
│   └── music-generator.js (AI music generation)
├── images/
│   └── avatar-placeholder.svg
├── index.html (Home/Discussion Feed)
├── login.html
├── signup.html
├── profile.html
├── write.html (Create Post)
├── post-detail.html
├── topics.html
├── notifications.html
├── settings.html
├── about.html
├── contact.html
├── faq.html
├── privacy.html
├── terms.html
├── music.html
└── README.md
```

## Design Decisions

- **Themable Interface**: Multiple theme options from philosophical to modern cyberpunk
- **Color Scheme**: Default theme inspired by the React documentation, featuring a primary blue (#087ea4)
- **Typography**: Poppins font family for clean, modern readability
- **Layout**: Responsive design with adaptive layouts for all device sizes
- **Interactions**: Subtle animations and hover effects for enhanced user experience (can be disabled in settings)
- **Accessibility**: High contrast options and keyboard navigation

## Future Enhancements

- Enhanced rich text editor with markdown support
- Advanced comment threading/nesting
- Full-text search functionality
- Reputation and badges system
- Private messaging
- Community moderation tools
- Content recommendation engine
- Progressive Web App (PWA) capabilities

## License

MIT License 