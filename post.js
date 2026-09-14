function showMore(button) {
  const paragraph = button.parentElement;
  const moreText = paragraph.querySelector(".more-text");

  moreText.style.display = "inline";
  button.style.display = "none";
}
