import gameRoutes from './gameLog.js';
import { Router } from 'express';
const router = Router();

router.use('/gamelog', gameRoutes);

router.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
});


export default router;
