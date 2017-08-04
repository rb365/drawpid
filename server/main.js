import { Meteor } from 'meteor/meteor';

const streamer = new Meteor.Streamer('draw');

Meteor.startup(() => {
  // code to run on server at startup
  streamer.allowRead('all');
  streamer.allowWrite('all');
});
