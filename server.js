const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const secretKey = require('./secretKey.js');
const jwt = require('jsonwebtoken');

app.set('port', process.env.PORT || 3000);


app.use(express.static('public'))
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json())
// app.use(checkAuth)

app.locals.title = 'BYOB';

const checkAuth = (req, res, next) => {
  const { token } = req.body;
  if (token) {
    try {
      const decoded = jwt.verify(token, secretKey)
      const isLegit = decoded.includes('@turing.io')
      if (isLegit) {
        next()
      } else {
        res.status(500).json({"Error": "Internal Server Error"})
      }
    } catch (error) {
      res.status(404).json({"Error": "That Token is Incorrect"})
    }
  } else {
    res.status(404).json({"Error": "Please enter your token"})
  }
}

// app.get('/', (req, res) => {
//   res.status(200).json()
// });

app.post('/api/v1/auth/', (req, res) => {
  const { email } = req.body;
  const isTuring = email.includes('turing.io')
  if (isTuring) {
    const token = jwt.sign(email, secretKey)
    res.status(201).send(token)
  } else {
    res.status(422).send('Error: Not Authorized Email')
  }
})

app.get('/api/v1/maps', (req, res) => {
  database('maps').select()
  .then(map => {
    res.status(200).json(map)
  })
  .catch(error => {
    res.status(404).json(error)
  });
});

app.get('/api/v1/pins', (req, res) => {
  database('pins').select()
  .then(pin => {
    res.status(200).json(pin)
  })
  .catch(error => {
    res.status(404).json(error)
  });
});

app.get('/api/v1/maps/:id', (req, res) => {
  const { id } = req.params;

  database('maps').where('id', id).select()
  .then(map => {
    res.status(200).json(map[0])
  })
  .catch(error => {
    res.status(404).json(error)
  });
});

app.get('/api/v1/pins/:id', (req, res) => {
  const { id } = req.params;

  database('pins').where('id', id).select()
  .then(pin => {
    res.status(200).json(pin[0])
  })
  .catch(error => {
    res.status(404).json(error)
  });
});

app.post('/api/v1/maps/', checkAuth, (req, res) => {
  const { map } = req.body;
  if (map.region) {
    database('maps').insert(map, "id")
    .then( map => {
      res.status(201).json({ id: map[0] })
    })
    .catch(error => {
      res.status(500).json(error)
    })
  } else {
    res.status(422).send({ error: 'Missing Data' })
  }
})

app.post('/api/v1/pins/', checkAuth, (req, res) => {
  const { pin } = req.body;
  if (pin.name) {
    database('pins').insert(pin, "id")
    .then( pin => {
      res.status(201).json({ id: pin[0] })

    }).catch( error => {
      res.status(500).json(error)
    })
  } else {
    res.status(422).send({ error: 'Missing Data'})
  }
})

app.put('/api/v1/maps/:id/', (req, res) => {
  const { id } = req.params;
  const { region } = req.body;

  if(region) {
    database('maps').where('id', id).update({ region: region })
    .then(region => {
      res.status(200).json('Region updated.')
    }).catch(error => {
      res.status(500).json(error)
    });
  } else {
    res.status(422).send({ error: 'Missing Region' });
  }
})


app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on Port 3000`);
});

module.exports = { app, database };