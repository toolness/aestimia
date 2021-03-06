#!/usr/bin/env node

var assert = require('assert');
var mongoose = require('mongoose');

const PORT = process.env['PORT'] || 3000;
const COOKIE_SECRET = process.env['COOKIE_SECRET'] || null;
const MONGO_URL = process.env['MONGO_URL'] || process.env['MONGOHQ_URL'] ||
  process.env['MONGOLAB_URI'] || 'mongodb://localhost/aestimia';
const DEBUG = ('DEBUG' in process.env);
const API_SECRET = process.env['API_SECRET'];
const THEME_DIR = process.env['THEME_DIR'];
const PERSONA_AUDIENCE = process.env['PERSONA_AUDIENCE'] || (DEBUG
  ? 'http://localhost:' + PORT
  : null);

assert.ok(PERSONA_AUDIENCE, 'PERSONA_AUDIENCE env var should be defined.');
assert.ok(COOKIE_SECRET, 'COOKIE_SECRET env var should be defined.');

mongoose.connect(MONGO_URL, function(err) {
  if (err) {
    console.error("Error connecting to mongodb instance at " +
                  MONGO_URL + ".\n" + err.stack);
    process.exit(1);
  }

  console.log("Connected to mongodb instance at " + MONGO_URL + ".");
  if (THEME_DIR)
    console.log("Using theme at " + THEME_DIR + ".");

  var app = require('../').app.build({
    cookieSecret: COOKIE_SECRET,
    debug: DEBUG,
    apiKey: API_SECRET,
    themeDir: THEME_DIR,
    personaAudience: PERSONA_AUDIENCE
  });

  app.listen(PORT, function() {
    console.log("API is " + (API_SECRET ? 'enabled' : 'disabled') + ".");
    console.log("Persona audience set to " + PERSONA_AUDIENCE +
                ".\nSite must be accessed through the above URL, or " +
                "login will fail.");
    console.log("Listening on port " + PORT + ".");
  });
});
