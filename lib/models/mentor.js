var _ = require('underscore');
var mongoose = require('mongoose');

var mentorSchema = new mongoose.Schema({
  // TODO: Add a validator for this.
  email: {type: String, required: true, unique: true},
  classifications: [String]
});

var Mentor = mongoose.model('Mentor', mentorSchema);

Mentor.classificationsFor = function classificationsFor(email, cb) {
  Mentor.findOne({
    email: email
  }, function(err, mentor) {
    if (err) return cb(err);
    var userClassifications = mentor ? mentor.classifications : [];
    Mentor.findOne({
      email: '*@' + email.split('@')[1]
    }, function(err, mentor) {
      if (err) return cb(err);
      var domainClassifications = mentor ? mentor.classifications : [];
      cb(null, _.union(userClassifications, domainClassifications));
    });
  });
};

module.exports = Mentor;
