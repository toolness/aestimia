var should = require('should');
var request = require('supertest');

describe('App', function() {
  var app = require('../').app.build({
    cookieSecret: 'testing'
  });

  it('should show flash messages', function(done) {
    app.get('/test-make-flash-message', function(req, res) {
      req.flash('info', '<em>hi</em>');
      return res.render('layout.html');
    });
    request(app)
      .get('/test-make-flash-message')
      .expect(/class="alert alert-info"/)
      .expect(/<em>hi<\/em>/)
      .expect(200, done);
  });

  it('should return 200 OK at /', function(done) {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200, done);    
  });

  it('should include CSRF tokens in pages', function(done) {
    request(app)
      .get('/')
      .expect(200, function(err, res) {
        if (err) return done(err);
        res.text.should.match(/name="csrf" content="[A-Za-z0-9\-_]+"/);
        done();
      });
  });

  it('should return 200 OK at /vendor/jquery.js', function(done) {
    request(app)
      .get('/vendor/jquery.js')
      .expect('Content-Type', /javascript/)
      .expect(200, done);
  });
});

describe('Nunjucks environment', function() {
  function FakeLoader(map) {
    return {
      getSource: function(name) {
        if (name in map) {
          return {
            src: map[name],
            path: name,
            upToDate: function() { return true; }
          };
        }
      }
    };
  }

  it('should autoescape', function(done) {
    var app = require('../').app.build({
      cookieSecret: 'testing'
    });
    app.nunjucksEnv.loaders.push(FakeLoader({
      'test_escaping.html': 'hi {{blah}}'
    }));
    app.get('/testing', function(req, res) {
      res.render('test_escaping.html', {blah: '<script>'});
    });
    request(app)
      .get('/testing')
      .expect('hi &lt;script&gt;')
      .expect(200, done);
  });
});
