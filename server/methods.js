Meteor.methods({
  addLine: function (line) {
    const NS_PER_SEC = 1e9;
    const time = process.hrtime();
    line.timestamp = time[0] * NS_PER_SEC + time[1];
    Lines.insert(line);
  }
});
