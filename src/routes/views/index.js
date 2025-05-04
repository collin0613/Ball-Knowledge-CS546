// routes/views/index.js
import userpageRoutes from './users.js';
import homepageRoutes from './home.js';
import matchupsRoutes from './matchups.js';
import { Router } from 'express';
const router = Router();

router.use('/', homepageRoutes);
router.use('/account', userpageRoutes);
router.use('/', matchupsRoutes);

router.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
});

export default router;
