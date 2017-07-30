FlowRouter.route('/', {
  name: 'home',
  action: function () {
    BlazeLayout.render("webLayout", {content: "home"});
  }
});