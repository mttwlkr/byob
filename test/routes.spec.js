const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const { app, database } = require('../server.js');

chai.use(chaiHttp);

describe('Testing endpoints', () => {
  beforeEach(done => {
    database.migrate.rollback()
    .then(() => {
      database.migrate.latest()
      .then(() => {
        database.seed.run()
        .then(() => {
          done();
        });
      });
    });
  });

  describe('GET', () => {
    
    it('should get all the maps', () => {
      return chai.request(app)
        .get('/api/v1/maps', (req, res) => {
          res.should.have.status(200)
          res.should.be.json;
          res.body.should.be.an('array')
          res.body.length.should.equal(4)
          res.body[0].should.have.property('id')
          res.body[0].should.have.property('region')
          res.body[0].should.have.property('center_lat')
          res.body[0].should.have.property('center_long')
          res.body[0].should.have.property('created_at')
          res.body[0].should.have.property('updated_at')
          res.body[0].id.should.equal(1)
          res.body[0].region.should.equal('California')
          res.body[0].center_lat.should.equal(36.78)
          res.body[0].center_long.should.equal(-119.42)
        })
    })
  });
  
  describe('POST', () => {
  
  });

  describe('PATCH', () => {
  
  });

  describe('DELETE', () => {
  
  });

})

