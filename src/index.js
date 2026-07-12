import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { DbService } from './services/db.service.js';
import { UserService } from './services/user.service.js';
import { AuthService } from './services/auth.service.js';
import { ProductService } from './services/product.service.js';
import { createAuthMiddleware } from './middlewares/auth.middleware.js';

const port = Number(process.env.PORT ?? 3000);
const apiPrefix = '/api';
const jwtSecret = process.env.JWT_SECRET ?? 'e-commerce-secret';

const app = express();
const dbService = new DbService();
await dbService.init();
const userService = new UserService(dbService);
const authService = new AuthService(userService, jwtSecret);
const productService = new ProductService(dbService);
const authMiddleware = createAuthMiddleware(authService);
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const upload = multer({
  storage: multer.memoryStorage(),
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

app.get(`${apiPrefix}/health`, (_req, res) => {
  res.json({ ok: true });
});

app.post(`${apiPrefix}/auth/login`, asyncHandler(async (req, res) => {
  const { username, password } = req.body ?? {};
  const loginResponse = await authService.login(username, password);

  if (!loginResponse) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(loginResponse);
}));

app.get(`${apiPrefix}/users`, asyncHandler(async (_req, res) => {
  const users = await userService.all();
  res.json(users);
}));

app.get(`${apiPrefix}/users/:id`, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const user = await userService.getById(id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
}));

app.get(`${apiPrefix}/products`, asyncHandler(async (req, res) => {
  const id = req.query.id ? Number(req.query.id) : null;

  if (id) {
    const product = await productService.getById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  }

  return res.json(await productService.all());
}));

app.post(`${apiPrefix}/uploads`, authMiddleware, (req, res) => {
  upload.single('file')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extension = req.file.originalname.includes('.')
      ? req.file.originalname.slice(req.file.originalname.lastIndexOf('.')).toLowerCase()
      : '';

    try {
      const uploadResponse = await dbService.uploadImage({
        fileBuffer: req.file.buffer,
        contentType: req.file.mimetype,
        extension,
      });

      return res.status(201).json(uploadResponse);
    } catch (uploadError) {
      return res.status(500).json({ message: uploadError.message });
    }
  });
});

app.post(`${apiPrefix}/products`, authMiddleware, asyncHandler(async (req, res) => {
  const product = await productService.create(req.body ?? {});
  return res.status(201).json(product);
}));

app.put(`${apiPrefix}/products`, authMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.query.id);
  const updatedProduct = await productService.update(id, req.body ?? {});

  if (!updatedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json(updatedProduct);
}));

app.delete(`${apiPrefix}/products`, authMiddleware, asyncHandler(async (req, res) => {
  const id = Number(req.query.id);
  const deletedProduct = await productService.delete(id);

  if (!deletedProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json(deletedProduct);
}));

app.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  if (error.message?.includes('Failed to')) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Unexpected server error' });
});

app.use((req, res) => {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`E-commerce API running on http://localhost:${port}${apiPrefix}`);
});