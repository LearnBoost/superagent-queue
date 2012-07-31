
/**
 * Module dependencies.
 */

var express = require('express')
  , superagent = require('superagent')

/**
 * Create express app.
 */

var app = express();
app.listen(5005);

/**
 * Testing route.
 */

var concurrent = 0
  , total = 0
  , interval

app.get('/', function(req, res){
  concurrent++;
  total++;

  setTimeout(function(){
    concurrent--;
    res.send(200);
  }, 500);
});

/**
 * Queue requests
 */

describe('superagent-queue', function(){

  it('adds the queue method', function(){
    (undefined == superagent.Request.prototype.queue).should.be.true;
    require('../superagent-queue');
    (undefined == superagent.Request.prototype.queue).should.be.false;
  });

  it('queues', function(done){
    var interval = setInterval(function(){
      concurrent.should.equal(1);
    }, 200);

    superagent
      .get('http://localhost:5005/')
      .queue('woot')
      .end(function(){
        total.should.equal(1);
        superagent.get('http://localhost:5005/')
          .queue('woot')
          .end(function(){
            total.should.equal(2);
            superagent.get('http://localhost:5005/')
              .queue('woot')
              .end(function(){
                total.should.equal(3);
                superagent.get('http://localhost:5005/')
                  .queue('woot')
                  .end(function(){
                    total.should.equal(4);
                    superagent.get('http://localhost:5005/')
                      .queue('woot')
                      .end(function(){
                        total.should.equal(5);
                        clearInterval(interval);
                        done();
                      })
                  })
              })
          })
      });
  });

  it('works with multiple queues', function(done){
    var total = 4;
    setTimeout(function(){
      concurrent.should.equal(2);
    }, 200);
    superagent.get('http://localhost:5005/')
      .queue('woot')
      .end(function(){
        --total || done();
      })
    superagent.get('http://localhost:5005/')
      .queue('woot')
      .end(function(){
        --total || done();
      });
    superagent.get('http://localhost:5005/')
      .queue('woot 2')
      .end(function(){
        --total || done();
      });
    superagent.get('http://localhost:5005/')
      .queue('woot 2')
      .end(function(){
        --total || done();
      });
  });

  it('works with no queues', function(done){
    var total = 2;
    setTimeout(function(){
      concurrent.should.equal(2);
    }, 200);
    superagent.get('http://localhost:5005/')
      .end(function(){
        --total || done();
      })
    superagent.get('http://localhost:5005/')
      .end(function(){
        --total || done();
      })
  });

  it('work with no callback', function(done){
    var xhr = superagent.get('http://localhost:5005').queue('test');
    xhr.on('end', done);
    xhr.end();
  });

});
