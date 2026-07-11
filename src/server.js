import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { DbService } from './services/db.service.js';
import { UserService } from './services/user.service.js';
import { AuthService } from './services/auth.service.js';
import { ProductService } from './services/product.service.js';
import { createAuthMiddleware } from './middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const dataFile = resolve(rootDir, 'data/db.json');
const uploadsDir = resolve(rootDir, 'public/uploads');
const port = Number(process.env.PORT ?? 3000);
const apiPrefix = '/api';
const jwtSecret = process.env.JWT_SECRET ?? 'e-commerce-secret';

const app = express();
const dbService = new DbService(dataFile);
await dbService.init();
const userService = new UserService(dbService);
const authService = new AuthService(userService, jwtSecret);
const productService = new ProductService(dbService);
const authMiddleware = createAuthMiddleware(authService);

mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const extension = file.originalname.includes('.')
        ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
        : '';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are allowed'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use(`${apiPrefix}/uploads`, express.static(uploadsDir));

app.get(`${apiPrefix}/health`, (_req, res) => {
  res.json({ ok: true });
});

app.post(`${apiPrefix}/auth/login`, (req, res) => {
  const { username, password } = req.body ?? {};
  const loginResponse = authService.login(username, password);

  if (!loginResponse) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(loginResponse);
});

app.get(`${apiPrefix}/users`, (_req, res) => {
  res.json(userService.all());
});

app.get(`${apiPrefix}/users/:id`, (req, res) => {
  const id = Number(req.params.id);
  const user = userService.getById(id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
});

app.get(`${apiPrefix}/products`, (req, res) => {
  const id = req.query.id ? Number(req.query.id) : null;

  if (id) {
    const product = productService.getById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  }

  return res.json(productService.all());
});

app.post(`${apiPrefix}/uploads`, authMiddleware, (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const url = `${req.protocol}://${req.get('host')}${apiPrefix}/uploads/${req.file.filename}`;
    return res.status(201).json({ filename: req.file.filename, url });
  });
});

app.post(`${apiPrefix}/products`, authMiddleware, async (req, res) => {
  const product = productService.create(req.body ?? {});
  await dbService.save();
  return res.status(201).json(product);
});

app.put(`${apiPrefix}/products`, authMiddleware, async (req, res) => {
  const id = Number(req.query.id);
  const updatedProduct = productService.update(id, req.body ?? {});

  if (!updatedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await dbService.save();
  return res.json(updatedProduct);
});

app.delete(`${apiPrefix}/products`, authMiddleware, async (req, res) => {
  const id = Number(req.query.id);
  const deletedProduct = productService.delete(id);

  if (!deletedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await dbService.save();
  return res.json(deletedProduct);
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`E-commerce API running on http://localhost:${port}${apiPrefix}`);
});