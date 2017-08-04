Meteor.publish('lines', function (timestamp) {
  return [
    Lines.find({timestamp: {$gt: timestamp}}, {sort: {timestamp: -1}, limit: 500})
  ];
});