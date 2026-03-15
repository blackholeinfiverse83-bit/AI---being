# How to Deploy the Auth Backend to Render

Since the repository is already connected and pushed to your GitHub, deploying this as a microservice on Render is very straightforward.

### 1. Create a New Web Service
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button in the top right and select **Web Service**.
3. Under "Connect a repository", select your GitHub repository: `AI---being` (or whatever the repo is named).

### 2. Configure the Service Details
Fill out the deployment settings exactly like this:

- **Name**: `ai-being-auth` (or any name you prefer)
- **Region**: Select the region closest to your users.
- **Branch**: `main`
- **Root Directory**: `Desktop/AI Being Render/backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` *(This maps to `node server.js` which we configured)*

### 3. Add Environment Variables
Scroll down to the **Environment Variables** section and click "Add Environment Variable". Add these exactly:

| Key | Value |
| :--- | :--- |
| `MONGO_URI` | `mongodb+srv://admin:Blackhole083@cluster0.zbqtkp.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | `ai_being_super_secret_jwt_key_2026` |
| `PORT` | `5000` |

### 4. Deploy!
Click the **Create Web Service** button at the bottom. 

Render will now clone the repo, navigate into the `backend` folder, install the dependencies, and start your Node.js authentication server.

---

### Final Step: Link the Frontend
Once Render finishes deploying your backend, it will give you a live URL (e.g., `https://ai-being-auth-onrender.com`). 

> **Important:** Copy that URL, go to your **Frontend**'s Environment Variables in Render, and change `REACT_APP_AUTH_API_URL` to match that live URL! Then, force a manual deploy on the frontend so it starts talking to the cloud auth instead of localhost.
