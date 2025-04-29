import apiRoutes from './api/index.js';
import viewsRoutes from './views/index.js';

const constructorMethod = (app) => {
  app.use('/api', apiRoutes);
  app.use('/', viewsRoutes);

  app.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;
