var should = require('should');
var cheerio = require('cheerio');
var nunjucks = require('nunjucks');
var _ = require('underscore');
var data = require('./data');
var models = require('../').models;
var filters = require('../').filters;

var loader = new nunjucks.FileSystemLoader(__dirname + '/../views');
var env = new nunjucks.Environment(loader, {autoescape: true});

Object.keys(filters).forEach(function(name) {
  env.addFilter(name, filters[name]);
});

function render(view, ctxOptions) {
  var ctx = _.extend({
    messages: function() { return []; }
  }, ctxOptions || {});
  return cheerio.load(env.render(view, ctx));
}

var awardedSubmission = data.baseSubmission({
  reviews: [{
      author: "foo@bar.org",
      response: "awesome",
      satisfiedRubrics: [0, 1]
  }]
});

var rejectedSubmission = data.baseSubmission({
  reviews: [{
      author: "foo@bar.org",
      response: "lame",
      satisfiedRubrics: []
  }]
});

describe('views/', function() {
  describe('demo.html', function() {
    it('should have an accordion', function() {
      var $ = render('demo.html', {
        sections: [{id: 'foo', title: 'Foo!', html: '<em>foo.</em>'}]
      });
      $("#api-actions #foo em").text().should.eql('foo.');
    });
  });

  describe('docs.html', function() {
    it('should have a ToC', function() {
      var $ = render('docs.html', {sections: [
        {id: 'foo', title: 'Foo!'},
        {id: 'bar', title: 'Bar!'}
      ]});
      $('.toc li.active a[href="#foo"]').text().should.eql('Foo!');
      $('.toc li:not(.active) a[href="#bar"]')
        .text().should.eql('Bar!');
    });
  });

  describe('submission-detail.html', function() {
    it('should hide email of underage learners', function() {
      var s = new models.Submission(data.submissions['canned-responses']);
      var $ = render('submission-detail.html', {submission: s});
      $.html().should.match(/An underage learner/i);
      $.html().should.not.match(/brian@example\.org/);
    });

    it('should show email of non-underage learners', function() {
      var s = new models.Submission(data.submissions['base']);
      var $ = render('submission-detail.html', {submission: s});
      $.html().should.not.match(/An underage learner/i);
      $.html().should.match(/brian@example\.org/);
    });

    it('should show review form for unreviewed submissions', function() {
      var s = new models.Submission(data.submissions['base']);
      var $ = render('submission-detail.html', {submission: s});
      $('form').length.should.eql(1);
    });

    it('should hide review form for reviewed submissions', function() {
      var s = new models.Submission(awardedSubmission);
      var $ = render('submission-detail.html', {submission: s});
      $('form').length.should.eql(0);
    });

    it('should embed image evidence in page', function() {
      var s = new models.Submission(data.baseSubmission({
        evidence: [{url: 'http://u/', mediaType: 'image'}]
      }));
      var $ = render('submission-detail.html', {submission: s});
      $('.thumbnail img').attr("src").should.eql('http://u/');
    });

    it('should hyperlink to link evidence', function() {
      var s = new models.Submission(data.baseSubmission({
        evidence: [{url: 'http://z/', mediaType: 'link'}]
      }));
      var $ = render('submission-detail.html', {submission: s});
      $('.thumbnail a').text().trim().should.eql('http://z/');
    });
  });

  describe('submission-list.html', function() {
    it('should hide email of underage learners', function() {
      var s = new models.Submission(data.submissions['canned-responses']);
      var $ = render('submission-list.html', {submissions: [s]});
      $.html().should.match(/An underage learner/i);
      $.html().should.not.match(/brian@example\.org/);
    });

    it('should show email of non-underage learners', function() {
      var s = new models.Submission(data.submissions['base']);
      var $ = render('submission-list.html', {submissions: [s]});
      $.html().should.not.match(/An underage learner/i);
      $.html().should.match(/brian@example\.org/);
    });

    it('should show view button for reviewed submissions', function() {
      var s = new models.Submission(awardedSubmission);
      var $ = render('submission-list.html', {submissions: [s]});
      $('a.btn').first().text().trim().should.eql('View');
    });

    it('should show review button for unreviewed submissions', function() {
      var s = new models.Submission(data.submissions['base']);
      var $ = render('submission-list.html', {submissions: [s]});
      $('a.btn').first().text().trim().should.eql('Review');
    });
  });

  describe('badge.html', function() {
    var AWARDED = '.text-success';
    var REJECTED = '.text-error';
    var AWAITING_REVIEW = '.muted';

    it('should show awarded status', function() {
      var s = new models.Submission(awardedSubmission);
      var $ = render('badge.html', {submission: s});
      $(AWARDED).length.should.eql(1);
      $(REJECTED).length.should.eql(0);
      $(AWAITING_REVIEW).length.should.eql(0);
    });

    it('should show rejected status', function() {
      var s = new models.Submission(rejectedSubmission);
      var $ = render('badge.html', {submission: s});
      $(AWARDED).length.should.eql(0);
      $(REJECTED).length.should.eql(1);
      $(AWAITING_REVIEW).length.should.eql(0);
    });

    it('should show awaiting-review status', function() {
      var s = new models.Submission(data.baseSubmission());
      var $ = render('badge.html', {submission: s});
      $(AWARDED).length.should.eql(0);
      $(REJECTED).length.should.eql(0);
      $(AWAITING_REVIEW).length.should.eql(1);
    });
  });

  describe('splash.html', function() {
    it('should show login button', function() {
      var $ = render('splash.html');
      $('.js-login').text().should.eql('Login');
      $('.js-logout').length.should.eql(0);
    });
  });

  describe('access-denied.html', function() {
    it('should show login button when user is logged out', function() {
      var $ = render('access-denied.html');
      $('.js-login').text().should.eql('Login');
      $('.js-logout').length.should.eql(0);
    });
  });

  describe('layout.html', function() {
    it('should embed email in a meta tag', function() {
      var $ = render('layout.html', {email: 'a@b.org'});
      $('meta[name="email"]').attr("content").should.eql('a@b.org');
    });

    it('should embed CSRF in a meta tag', function() {
      var $ = render('layout.html', {csrfToken: 'sup'});
      $('meta[name="csrf"]').attr("content").should.eql('sup');
    });

    it('should show logout link when user is logged in', function() {
      var $ = render('layout.html', {email: 'u'});
      $('.js-logout').text().should.eql('Logout');
      $('.js-login').length.should.eql(0);
    });

    it('should show alert messages', function() {
      var $ = render('layout.html', {
        messages: function() { return [{
          category: 'victory',
          html: '<em>you win!</em>'
        }] }
      });
      $('.alert.alert-victory').length.should.eql(1);
      $('.alert.alert-victory em').text().should.eql('you win!');
    });
  });
});
