import gameRoutes from './gameLog.js';
import userRoutes from './users.js';
import baseRoutes from './base.js';


const constructorMethod = (app) => {
  app.use('/gamelog', gameRoutes);
  app.use('/account', userRoutes);
  app.use('/', baseRoutes);

  app.use('*', (req, res) => {
    return res.status(404).json({error: 'Not found'});
  });
};

export default constructorMethod;
