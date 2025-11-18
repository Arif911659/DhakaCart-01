# 🚀 DhakaCart Quick Reference Card

## ⚡ Essential Commands

### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Rebuild and start
docker-compose up -d --build

# Clean everything
docker-compose down -v
```

### Kubernetes
```bash
# Deploy all
kubectl apply -f k8s/

# Get all resources
kubectl get all -n dhakacart

# View logs
kubectl logs -f deployment/backend -n dhakacart

# Scale deployment
kubectl scale deployment backend --replicas=5 -n dhakacart

# Delete all
kubectl delete namespace dhakacart
```

### Git Commands
```bash
# Initial commit
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <url>
git push -u origin main

# Update changes
git add .
git commit -m "Update: description"
git push
```

---

## 📁 File Checklist

### ✅ Must Have Files

```
dhakacart/
├── backend/
│   ├── server.js ✓
│   ├── package.json ✓
│   ├── Dockerfile ✓
│   ├── .env ✓
│   ├── controllers/ ✓
│   ├── middleware/ ✓
│   └── routes/ ✓
├── frontend/
│   ├── src/App.js ✓
│   ├── package.json ✓
│   ├── Dockerfile ✓
│   └── .env ✓
├── database/
│   └── schema.sql ✓
├── k8s/
│   ├── deployment.yaml ✓
│   ├── service.yaml ✓
│   └── ingress.yaml ✓
├── docker-compose.yml ✓
├── .gitignore ✓
└── README.md ✓
```

---

## 🔧 Troubleshooting

### Problem: Port already in use
```bash
# Find process
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>
```

### Problem: Database connection failed
```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Problem: Frontend can't connect to backend
```bash
# Check backend health
curl http://localhost:5000/health

# Check CORS settings in backend
# Ensure REACT_APP_API_URL is correct
```

### Problem: Out of disk space
```bash
# Clean Docker
docker system prune -a --volumes

# Clean node_modules
rm -rf backend/node_modules frontend/node_modules
```

---

## 🎯 Testing Checklist

### ✅ Local Testing
- [ ] Backend health: `curl http://localhost:5000/health`
- [ ] Frontend loads: `http://localhost:3000`
- [ ] Can register user
- [ ] Can login
- [ ] Products display
- [ ] Can add to cart
- [ ] Can checkout
- [ ] Admin panel works
- [ ] Database has data

### ✅ Deployment Testing
- [ ] All pods running: `kubectl get pods -n dhakacart`
- [ ] Services accessible
- [ ] Load balancer configured
- [ ] Auto-scaling works
- [ ] Health checks pass
- [ ] Logs are visible

---

## 📊 Useful URLs

### Local Development
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health
- Postgres: localhost:5432
- Redis: localhost:6379

### Production (Example)
- Website: https://dhakacart.example.com
- API: https://dhakacart.example.com/api
- Admin: https://dhakacart.example.com/admin

---

## 🔑 Default Credentials

### Admin
```
Email: admin@dhakacart.com
Password: admin123
```

### Test Customer
```
Email: ahmed@example.com
Password: password123
```

### Database
```
Host: localhost
Port: 5432
Database: dhakacart
User: postgres
Password: postgres
```

---

## 📝 Common API Endpoints

### Authentication
```bash
# Register
POST /api/auth/register
Body: {"name": "...", "email": "...", "password": "..."}

# Login
POST /api/auth/login
Body: {"email": "...", "password": "..."}
```

### Products
```bash
# Get all products
GET /api/products?category=laptops&search=dell

# Get single product
GET /api/products/:id
```

### Orders
```bash
# Create order
POST /api/orders
Headers: Authorization: Bearer <token>
Body: {"items": [...], "shipping_address": "..."}

# Get user orders
GET /api/orders
Headers: Authorization: Bearer <token>
```

---

## 🚨 Emergency Commands

### Complete Reset
```bash
# Stop everything
docker-compose down -v

# Remove all images
docker rmi $(docker images -q dhakacart/*)

# Rebuild from scratch
docker-compose up -d --build
```

### Database Reset
```bash
# Drop and recreate database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE dhakacart;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE dhakacart;"
docker-compose exec postgres psql -U postgres -d dhakacart -f /docker-entrypoint-initdb.d/01-schema.sql
```

### Clear Redis Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

---

## 📦 Dependencies Installation

### Backend
```bash
cd backend
npm install express cors pg redis bcrypt jsonwebtoken dotenv
npm install --save-dev nodemon
```

### Frontend
```bash
cd frontend
npx create-react-app .
npm install react-router-dom axios
```

---

## 🎨 VS Code Extensions

1. ES7+ React/Redux/React-Native snippets
2. Prettier - Code formatter
3. ESLint
4. Docker
5. Kubernetes
6. GitLens
7. Thunder Client

---

## 💡 Pro Tips

1. **Always commit before major changes**
   ```bash
   git add .
   git commit -m "Before: description"
   ```

2. **Use environment variables**
   - Never commit `.env` files
   - Always use `.env.example`

3. **Check logs first**
   ```bash
   docker-compose logs -f <service-name>
   ```

4. **Test locally before deploying**
   ```bash
   docker-compose up -d
   # Test everything
   docker-compose down
   ```

5. **Keep images small**
   - Use Alpine base images
   - Multi-stage builds
   - .dockerignore file

---

## 🎯 Project Milestones

- [x] Step 1: Frontend - Product Catalog
- [x] Step 2: Backend API
- [x] Step 3: Database Schema
- [x] Step 4: Authentication
- [x] Step 5: Admin Dashboard
- [x] Step 6: Payment Integration
- [x] Step 7: DevOps Setup

---

## 📞 Quick Help

**Can't start Docker?**
```bash
sudo service docker start  # Linux
# Or restart Docker Desktop
```

**Port conflict?**
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Instead of 3000:3000
```

**Database issues?**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

**Build errors?**
```bash
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## ⏱️ Estimated Time

- Initial Setup: 30 minutes
- Development: 2-3 weeks
- Testing: 1 week
- Deployment: 1-2 days
- **Total: 4 weeks** ✅

---

**📌 Save this as a bookmark or print it out!**

**Good luck with your project! 🚀**