import apiRoutes from './api/index.js';
import viewsRoutes from './views/index.js';
import baseRoutes from './base.js';

const constructorMethod = (app) => {
  app.use('/api', apiRoutes);
  app.use('/', viewsRoutes);
  app.use('/', baseRoutes);

  app.use('*', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
  });
};

export default constructorMethod;
