// Instance the tour
var tour = new Tour({
  steps: [
  {
    element: "#step1",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#step2",
    title: "Title of my step",
    content: "Content of my step"
  }
]});
tour.init("#step1");
tour.start();

