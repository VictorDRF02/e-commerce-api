# E-commerce API

A simple and practical **Express.js REST API** for e-commerce projects, with:

- JWT authentication
- Products CRUD
- Users listing
- Image uploads (Supabase Storage)
- Supabase database integration

## Live Demo

- **Production URL:** https://e-commerce-api-theta-self.vercel.app

---

## Tech Stack

- **Node.js**
- **Express**
- **Supabase** (`@supabase/supabase-js`)
- **JWT** (`jsonwebtoken`)
- **Multer** (in-memory image uploads)
- **CORS**

---

## Project Structure

```bash
.
├── src
│   ├── index.js
│   ├── middlewares
│   │   └── auth.middleware.js
│   └── services
│       ├── auth.service.js
│       ├── db.service.js
│       ├── product.service.js
│       └── user.service.js
├── .env.example
└── package.json
```

---

## Features

- **Health check endpoint**
- **Authentication login** with JWT
- **Users endpoints** (list and detail)
- **Products endpoints**:
  - list all
  - get one by ID
  - create
  - update
  - delete
- **Image upload endpoint** (protected)
- **Image URL redirect endpoint** (`/uploads/:filename`)
- Centralized error handling and 404 fallback

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
PORT=3000
JWT_SECRET=change-this-secret

SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=uploads
SUPABASE_USERS_TABLE=users
SUPABASE_PRODUCTS_TABLE=products

# Optional fallback login user (works even if users table is empty)
AUTH_USERNAME=
AUTH_PASSWORD=
AUTH_USER_ID=1
AUTH_EMAIL=
AUTH_NAME=
AUTH_PHONE=
```

### Notes

- `SUPABASE_SERVICE_ROLE_KEY` is sensitive. Never expose it publicly.
- `AUTH_USERNAME` + `AUTH_PASSWORD` can be used as a fallback login when your users table is empty.
- If `PORT` is not set, the API uses `3000`.

---

## Installation

```bash
npm install
```

---

## Running the API

### Development mode (watch)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Server default URL:

- `http://localhost:3000/api`

---

## API Base Path

All routes are under:

- `/api`

---

## Authentication

### Login

**POST** `/api/auth/login`

#### Request body

```json
{
  "username": "your-username",
  "password": "your-password"
}
```

#### Success response (200)

Returns login payload including a JWT token (shape depends on `AuthService`).

#### Error response (401)

```json
{
  "message": "Invalid credentials"
}
```

### Protected routes

Use a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

Protected endpoints:

- `POST /api/uploads`
- `POST /api/products`
- `PUT /api/products?id=<id>`
- `DELETE /api/products?id=<id>`

---

## Endpoints

## 1) Health

### GET `/api/health`

#### Response

```json
{
  "ok": true
}
```

---

## 2) Users

### GET `/api/users`

Returns all users.

### GET `/api/users/:id`

Returns one user by numeric ID.

#### Not found (404)

```json
{
  "message": "User not found"
}
```

---

## 3) Products

### GET `/api/products`

Returns all products.

### GET `/api/products?id=<id>`

Returns a single product by query param ID.

#### Not found (404)

```json
{
  "message": "Product not found"
}
```

### POST `/api/products` (Protected)

Creates a product with JSON body.

#### Success (201)

Returns created product object.

### PUT `/api/products?id=<id>` (Protected)

Updates an existing product by ID.

#### Not found (404)

```json
{
  "message": "Product not found"
}
```

### DELETE `/api/products?id=<id>` (Protected)

Deletes a product by ID.

#### Not found (404)

```json
{
  "message": "Product not found"
}
```

---

## 4) Uploads

### POST `/api/uploads` (Protected)

Uploads an image file to Supabase Storage.

- Form field name: `file`
- Allowed MIME type: `image/*`
- Max size: `5MB`

#### Success (201)

Returns upload metadata (depends on storage service response).

#### Errors (400)

```json
{
  "message": "No file uploaded"
}
```

or multer/file validation errors (e.g. invalid type, file too large).

---

### GET `/api/uploads/:filename`

Validates filename and redirects to public image URL from storage.

- Success: `302` redirect
- Invalid filename: `400`

```json
{
  "message": "Invalid or missing filename"
}
```

---

## Error Handling

- Internal errors return `500`:
  - Known storage/db style errors may return their specific message.
  - Other unhandled errors return:

```json
{
  "message": "Unexpected server error"
}
```

- Unknown routes return `404`:

```json
{
  "message": "Route not found: <METHOD> <URL>"
}
```

---

## Example cURL Requests

### Health

```bash
curl http://localhost:3000/api/health
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get all products

```bash
curl http://localhost:3000/api/products
```

### Create product (protected)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Keyboard","price":49.99,"stock":20}'
```

### Upload image (protected)

```bash
curl -X POST http://localhost:3000/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

---

## Scripts

From `package.json`:

- `npm start` → `node --env-file=.env src/index.js`
- `npm run dev` → `node --watch src/index.js`

---

## Security Recommendations

- Use a strong `JWT_SECRET` in production.
- Rotate and protect `SUPABASE_SERVICE_ROLE_KEY`.
- Restrict CORS origins in production (instead of allowing all).
- Validate and sanitize all user input.
- Consider rate limiting for auth and upload endpoints.

---

## License

No license file is currently defined in this repository.

If you want, add a `LICENSE` file (for example: MIT).
