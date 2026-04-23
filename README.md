# 🍽️ Zenvy – Smart Food Ordering Web App

Zenvy is a modern, full-stack food ordering web application designed to provide a seamless and fast user experience. It enables users to browse food items, place orders, and interact with a responsive and dynamic UI.

The application is built using a scalable architecture with frontend, backend services, and database integration.

---

## 🚀 Live Demo

👉 https://zenvy-food.lovable.app

---

## 🧠 Project Highlights

* ⚡ Fast and optimized UI using Vite + React
* 🎨 Clean and responsive design with Tailwind CSS
* 🔗 Backend integration using Supabase
* 🧩 Modular and scalable folder structure
* 🔄 Real-time-ready architecture for future expansion

---

## 🛠️ Tech Stack

### Frontend

* React (with TypeScript)
* Vite
* Tailwind CSS

### Backend & Database

* Supabase (Authentication, Database, Edge Functions)

### Other Tools

* ESLint (code quality)
* Vitest (testing)
* PostCSS

---

## 📂 Project Structure

```
zenvy/
│
├── public/                # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── assets/            # Images and static resources
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context API
│   ├── data/              # Static/dummy data
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # External integrations
│   │   └── supabase/      # Supabase client setup
│   ├── lib/               # Utility functions
│   ├── pages/             # Application pages
│   ├── services/          # API/service layer
│   ├── test/              # Test cases
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── styles             # CSS files
│
├── supabase/
│   ├── functions/         # Edge functions (e.g., place-order)
│   ├── migrations/        # Database schema changes
│   └── config.toml
│
├── .env                   # Environment variables
├── package.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/zenvy.git
cd zenvy
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4️⃣ Run the project

```bash
npm run dev
```

---

## 🔌 Supabase Integration

* Authentication (optional for future use)
* Database for storing orders
* Edge Function:

  * `place-order` → Handles order processing

---

## ✨ Features

* 🛒 Browse food items
* 📱 Fully responsive UI
* ⚡ Fast page loading
* 🔄 Modular component structure
* 🧾 Order placement system (via Supabase function)

---

## 🧪 Testing

Run tests using:

```bash
npm run test
```

---

## 🎯 Future Enhancements

* 🔐 User authentication (Login/Register)
* 💳 Payment gateway integration
* 📦 Order tracking system
* 🤖 AI-based food recommendations
* 🧑‍💼 Admin dashboard
* 📊 Analytics system

---

## 👨‍💻 Author

**Nanda Kishore**

* B.Tech CSE Student
* Interested in AI/ML, Web Development, and Startups

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
