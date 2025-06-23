const inputGroups = document.querySelectorAll('.file-input');
inputGroups.forEach(ig => {
  const input = ig.querySelector('input');
  const fileName = ig.querySelector('.file-input-name');

  input.addEventListener('change', function () {
    const [file] = this.files;
    fileName.textContent = file.name;
    fileName.title = file.name;
  });
});
