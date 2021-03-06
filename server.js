const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.set('port', process.env.PORT || 3000);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.locals.title = 'BYOB';

const checkAuth = (req, res, next) => {
  const { token } = req.body;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_PASS);
      const isLegit = decoded.includes('@turing.io');
      if (isLegit) {
        next();
      } else {
        res.status(500).json({"Error": "Internal Server Error"});
      }
    } catch (error) {
      res.status(404).json({"Error": "That Token is Incorrect"});
    }
  } else {
    res.status(404).json({"Error": "Please enter your token"});
  }
};

app.post('/api/v1/auth/', (req, res) => {
  const { email } = req.body;
  if (email) {
    const token = jwt.sign(email, process.env.JWT_PASS);
    res.status(201).json(token);
  } else {
    res.status(422).send('Error: Not Authorized Email');
  }
});

app.get('/api/v1/maps', (req, res) => {
  var url = require('url');
  const urlParts = url.parse(req.url, true);
  var query = urlParts.query;

  if (query) {
    database('maps').where(query)
      .then( map => {
        res.status(200).json(map);
      })
      .catch( error => {
        res.status(404).json(error);
      });
  } else {
    database('maps').select()
      .then(map => {
        res.status(200).json(map);
      })
      .catch(error => {
        res.status(404).json(error);
      }); 
  }
});

app.get('/api/v1/pins', (req, res) => {
  database('pins').select()
    .then(pin => {
      res.status(200).json(pin);
    })
    .catch(error => {
      res.status(404).json(error);
    });
});

app.get('/api/v1/maps/:id', (req, res) => {
  const { id } = req.params;

  database('maps').where('id', id).select()
    .then(map => {
      if (map.length > 0) {
        res.status(200).json(map[0]);  
      } else {
        res.status(404).json('error');
      }
    })
    .catch(error => {
      res.status(404).json(error);
    });
});

app.get('/api/v1/pins/:id', (req, res) => {
  const { id } = req.params;

  database('pins').where('id', id).select()
    .then(pin => {
      if (pin.length > 0) {
        res.status(200).json(pin[0]); 
      } else {
        res.status(404).json('error');
      }
    })
    .catch(error => {
      res.status(404).json(error);
    });
});

app.post('/api/v1/maps/', checkAuth, (req, res) => {
  const { map }  = req.body;
  if (map.region) {
    database('maps').insert(map, "id")
      .then( map => {
        res.status(201).json({ id: map[0] });
      })
      .catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(422).send({ error: 'Missing Data' });
  }
});

app.post('/api/v1/pins/', checkAuth, (req, res) => {
  const { pin } = req.body;
  if (pin.name) {
    database('pins').insert(pin, "id")
      .then( pin => {
        res.status(201).json({ id: pin[0] });
      }).catch( error => {
        res.status(500).json(error);
      });
  } else {
    res.status(422).send({ error: 'Missing Data'});
  }
});

app.put('/api/v1/maps/:id/', checkAuth, (req, res) => {
  const { id } = req.params;
  const { map } = req.body;

  if (map.region) {
    database('maps').where('id', id).update({ region: map.region })
      .then(region => {
        if (region > 0) {
          res.status(200).json(`Region ${region} updated.`);  
        } else {
          res.status(404).json(region);
        }
      }).catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(422).send({ error: 'Missing Region' });
  }
});

app.put('/api/v1/pins/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  if (pin.name) {
    database('pins').where('id', id).update({ name: pin.name })
      .then(pin => {
        if (pin > 0) {
          res.status(200).json(`Name ${pin} updated.`); 
        } else {
          res.status(404).json(pin);
        }
      }).catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(422).send({ error: 'Missing Name'});
  }
});

app.delete('/api/v1/pins/name/:name', (req, res) => {
  const { name } = req.params;
  database('pins').where('name', name).delete()
    .then(pin => {
      if (pin > 0) {
        res.status(202).json(`Pin ${pin} deleted.`); 
      } else {
        res.status(404).json(pin);
      }
    }).catch(error => {
      res.status(500).json(error);
    });
});

app.delete('/api/v1/pins/id/:id', (req, res) => {
  const { id } = req.params;
  database('pins').where('id', id).delete()
    .then(pin => {
      if (pin > 0) {
        res.status(202).json(`Pin ${pin} deleted.`);  
      } else {
        res.status(404).json(pin);
      }
    }).catch(error => {
      res.status(500).json(error);
    });
});

app.listen(app.get('port'), () => {
  // eslint-disable-next-line
  console.log(`${app.locals.title} is running on Port 3000`);
});

module.exports = { app, database };