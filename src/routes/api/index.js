import gameRoutes from './gameLog.js';
import profileRoutes from './profile.js';
import { Router } from 'express';
const router = Router();

router.use('/gamelog', gameRoutes);
router.use('/profile', profileRoutes);

router.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
});


export default router;
