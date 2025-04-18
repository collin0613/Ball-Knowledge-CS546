import {MongoClient, ServerApiVersion} from 'mongodb';
import {mongoConfig} from './settings.js';

let _connection = undefined;
let _db = undefined;

export const dbConnection = async () => {
  if(!_connection){
    _connection = new MongoClient(mongoConfig.serverUrl, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    await _connection.connect();
    _db = _connection.db(mongoConfig.database);
    await _connection.db("admin").command({ping: 1});
  }
  return _db;
};

export const closeConnection = async () => {
  if(_connection){
    await _connection.close();
    _connection = undefined;
  }
};



