import gameRoutes from './gameLog.js';


const constructorMethod = (app) => {
  app.use('/gamelog', gameRoutes);

  app.use('*', (req, res) => {
    return res.status(404).json({error: 'Not found'});
  });
};

export default constructorMethod;