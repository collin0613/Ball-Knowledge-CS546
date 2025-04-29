import userpageRoutes from './users.js';
import homepageRoutes from './home.js';
import { Router } from 'express';
const router = Router();

router.use('/', homepageRoutes);
router.use('/account', userpageRoutes);

router.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
});

export default router;
