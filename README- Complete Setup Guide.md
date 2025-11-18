# 🎯 DhakaCart - Complete Setup Guide

## 📦 Quick Start (3 Commands!)

```bash
# 1. Clone/Create project
git clone <your-repo> dhakacart
cd dhakacart

# 2. Start everything with Docker
docker-compose up -d

# 3. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Admin Panel: http://localhost:3000/admin
```

---

## 🛠️ VS Code Complete Setup

### Step 1: Create Project Structure

```bash
mkdir dhakacart && cd dhakacart

# Create all directories
mkdir -p backend/{controllers,middleware,routes,models,utils,config}
mkdir -p frontend/src/{pages/admin,components,context,services,styles}
mkdir -p database/migrations
mkdir -p k8s
mkdir -p .github/workflows
mkdir nginx

# Open in VS Code
code .
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm init -y

# Install all dependencies
npm install express cors pg redis bcrypt jsonwebtoken dotenv multer nodemailer pdfkit

# Install dev dependencies
npm install --save-dev nodemon jest

# Update package.json scripts
```

**backend/package.json scripts:**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest"
}
```

### Step 3: Create Backend Files

Copy all the provided backend code into these files:

1. **server.js** - Main server file
2. **controllers/** - All controller files
   - `authController.js`
   - `productController.js`
   - `orderController.js`
   - `adminController.js`
   - `paymentController.js`
3. **middleware/** - All middleware files
   - `authMiddleware.js`
   - `roleMiddleware.js`
   - `validationMiddleware.js`
4. **routes/** - All route files
   - `authRoutes.js`
   - `productRoutes.js`
   - `orderRoutes.js`
   - `adminRoutes.js`
   - `paymentRoutes.js`

### Step 4: Create Backend .env

```bash
# backend/.env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dhakacart
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Step 5: Create Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
```

### Step 6: Install Frontend Dependencies

```bash
cd ../frontend
npx create-react-app .

# Install additional dependencies
npm install react-router-dom axios
```

### Step 7: Create Frontend Files

Create all the provided frontend files:

1. **src/App.js** - Main app component with routing
2. **src/context/** - Context providers
   - `AuthContext.js`
   - `CartContext.js`
3. **src/services/api.js** - API service
4. **src/pages/** - All page components
5. **src/components/** - All shared components

### Step 8: Create Frontend .env

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

### Step 9: Create Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Step 10: Create Nginx Config

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 11: Create Database Schema

```bash
# Copy the provided schema.sql to database/schema.sql
```

### Step 12: Create Docker Compose

```bash
# Copy the provided docker-compose.yml to root directory
```

---

## 🚀 Running the Application

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Option 2: Local Development

**Terminal 1 - Database:**
```bash
# Install PostgreSQL and Redis locally or use Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 📊 Testing the Application

### 1. Test Backend Health

```bash
curl http://localhost:5000/health
```

### 2. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Access Frontend

Open browser: http://localhost:3000

**Default Admin Credentials:**
- Email: `admin@dhakacart.com`
- Password: `admin123`

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Update JWT_SECRET with strong random string
- [ ] Enable HTTPS/SSL
- [ ] Set proper CORS origins
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Add monitoring and logging
- [ ] Review and update security headers
- [ ] Scan for vulnerabilities

---

## 📈 Scaling to Production

### Deploy to AWS EKS

```bash
# Create EKS cluster
eksctl create cluster --name dhakacart --region us-east-1

# Build and push Docker images
docker build -t dhakacart/backend:latest ./backend
docker build -t dhakacart/frontend:latest ./frontend

docker push dhakacart/backend:latest
docker push dhakacart/frontend:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Check deployments
kubectl get all -n dhakacart

# Get external IP
kubectl get ingress -n dhakacart
```

---

## 🎯 Features Implemented

### ✅ Step 1: E-commerce Frontend
- Product catalog with grid view
- Search and filter functionality
- Shopping cart with quantity management
- Multi-step checkout process
- Order confirmation page

### ✅ Step 2: Backend API
- RESTful API architecture
- Product management endpoints
- Order processing system
- User authentication with JWT

### ✅ Step 3: Database Schema
- Users, Products, Orders, Payments tables
- Relationships and foreign keys
- Indexes for performance
- Views for reporting

### ✅ Step 4: Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Customer, Admin)
- Protected routes and middleware

### ✅ Step 5: Admin Dashboard
- Product management (CRUD)
- Order management with status updates
- User management
- Analytics and reporting
- Sales dashboard

### ✅ Step 6: Payment Integration
- bKash payment simulation
- Credit/Debit card payment simulation
- Cash on Delivery option
- Payment status tracking
- Refund processing

### ✅ Step 7: DevOps Setup
- Docker containerization
- Docker Compose for local development
- Kubernetes manifests for production
- Horizontal Pod Autoscaling
- Health checks and liveness probes
- CI/CD pipeline ready

---

## 🛡️ DevOps Transformation Features

### 1. Containerization ✅
- All components dockerized
- Multi-stage builds for optimization
- Non-root user for security
- Health checks implemented

### 2. Orchestration ✅
- Kubernetes deployment manifests
- Service definitions
- Ingress configuration
- Auto-scaling policies

### 3. High Availability ✅
- Multiple replicas of backend/frontend
- Load balancing
- Automatic failover
- Zero-downtime deployments

### 4. Monitoring & Logging ✅
- Health check endpoints
- Structured logging
- Ready for Prometheus/Grafana
- Application metrics

### 5. Security ✅
- Secrets management
- Network policies
- HTTPS/TLS configuration
- Role-based access control

### 6. Scalability ✅
- Horizontal Pod Autoscaler
- Database connection pooling
- Redis caching layer
- Stateless application design

---

## 📚 Project Structure

```
dhakacart/
├── backend/                 # Node.js Backend
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, validation
│   ├── routes/            # API routes
│   ├── server.js          # Entry point
│   └── Dockerfile
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # State management
│   │   └── services/      # API calls
│   └── Dockerfile
├── database/               # Database
│   └── schema.sql         # Complete schema
├── k8s/                   # Kubernetes
│   ├── deployment.yaml    # Deployments
│   ├── service.yaml       # Services
│   ├── ingress.yaml       # Ingress
│   └── hpa.yaml          # Auto-scaling
├── .github/workflows/     # CI/CD
│   └── ci-cd.yml         # Pipeline
└── docker-compose.yml     # Local development
```

---

## 🎓 Learning Resources

- **Docker:** https://docs.docker.com/
- **Kubernetes:** https://kubernetes.io/docs/
- **React:** https://react.dev/
- **Node.js:** https://nodejs.org/docs/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 🤝 Support

যদি কোনো সমস্যা হয়:

1. Check logs: `docker-compose logs -f`
2. Verify health: `curl http://localhost:5000/health`
3. Restart services: `docker-compose restart`
4. Clean rebuild: `docker-compose down -v && docker-compose up -d --build`

---

## ✨ Congratulations!

আপনার DhakaCart E-commerce Application সম্পূর্ণ তৈরি! 🎉

**এখন আপনি করতে পারেন:**
- ✅ Local এ run করতে পারবেন
- ✅ Docker Compose দিয়ে deploy করতে পারবেন
- ✅ Kubernetes এ scale করতে পারবেন
- ✅ Production এ deploy করতে পারবেন
- ✅ CI/CD pipeline setup করতে পারবেন

**Your Final Exam Project is Ready! 🚀**