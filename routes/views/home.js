import { Router } from 'express';
const router = Router();

router.route('/').get(async (req, res) => {
    try {
        res.render('homepage');
    } catch (e) {
        res.status(500).render('error', {
            error: 'An error occurred while loading the login page.'
        });
    }
});

export default router;