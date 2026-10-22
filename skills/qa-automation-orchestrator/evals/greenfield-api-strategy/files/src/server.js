import express from 'express';
const app = express();
app.use(express.json());
const users = { 'qa@example.com': { id: 'u1', password: 'secret-pass', token: 'tok-u1' } };
const todos = new Map();
let seq = 1;
const authCalls = [];
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = Object.values(users).find((u) => u.token === token);
  if (!user) return res.status(401).json({ message: 'Access denied' });
  req.user = user; next();
}
app.post('/api/auth/login', (req, res) => {
  const now = Date.now(); authCalls.push(now);
  const recent = authCalls.filter((t) => now - t < 900_000);
  res.set('RateLimit-Policy', '40;w=900'); res.set('RateLimit-Remaining', String(Math.max(0, 40 - recent.length)));
  if (recent.length > 40) { res.set('Retry-After', '900'); return res.status(429).json({ message: 'Too many requests' }); }
  const { email, password } = req.body || {};
  const user = users[email];
  if (!user || user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });
  res.json({ token: user.token, role: 'user' });
});
app.get('/api/todos', auth, (req, res) => {
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: "Invalid 'limit'" });
  const all = [...todos.values()].filter((t) => t.userId === req.user.id);
  const items = all.slice((page - 1) * limit, page * limit);
  res.json({ todos: items, pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) } });
});
app.post('/api/todos', auth, (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (title.length > 200) return res.status(400).json({ message: 'Title is too long' });
  const todo = { _id: `t${seq++}`, userId: req.user.id, title, completed: false, createdAt: new Date().toISOString() };
  todos.set(todo._id, todo); res.status(201).json({ todo });
});
app.patch('/api/todos/:id', auth, (req, res) => {
  if (!/^t\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid todo id' });
  const todo = todos.get(req.params.id);
  if (!todo || todo.userId !== req.user.id) return res.status(404).json({ message: 'Todo not found' });
  if (req.body.title !== undefined) todo.title = String(req.body.title);
  if (req.body.completed !== undefined) todo.completed = Boolean(req.body.completed);
  res.json({ todo });
});
app.delete('/api/todos/:id', auth, (req, res) => {
  if (!/^t\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid todo id' });
  if (!todos.has(req.params.id)) return res.status(404).json({ message: 'Todo not found' });
  todos.delete(req.params.id); res.json({ message: 'Deleted' });
});
app.listen(process.env.PORT || 3000);
