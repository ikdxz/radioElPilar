
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

document.getElementById('access').addEventListener('click', () => {  
  fetch('/access')
    .then(response => {
      if (response.redirected) {
        // Si el servidor redirige, vamos a la nueva URL
        window.location.href = response.url;
      } else {
        // Si no hay redirección, puedes manejar aquí
        console.log('No hubo redirección');
      }
    })
    .catch(err => console.error('Error en fetch:', err));
});

document.getElementById('return').addEventListener('click', () => {
  fetch('/radio')
    .then(response => {
      if (response.redirected) {
        // Si el servidor redirige, vamos a la nueva URL
        window.location.href = response.url;
      } else {
        // Si no hay redirección, puedes manejar aquí
        console.log('No hubo redirección');
      }
    })
    .catch(err => console.error('Error en fetch:', err));
});

  // Al hacer click en la zona, abre el selector de archivos
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Cuando se selecciona un archivo por el input tradicional
  fileInput.addEventListener('change', () => {
    if(fileInput.files.length > 0) {
      dropZone.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
    }
  });

  // Evita el comportamiento por defecto para drag events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Cambiar estilo cuando arrastramos un archivo sobre la zona
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.style.borderColor = '#c9289e';
      dropZone.style.backgroundColor = '#fce4ec';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.style.borderColor = '#ccc';
      dropZone.style.backgroundColor = '';
    });
  });

  // Cuando soltamos un archivo
  dropZone.addEventListener('drop', (e) => {
    if(e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;  // Poner archivo en el input real
      dropZone.textContent = `Archivo seleccionado: ${e.dataTransfer.files[0].name}`;
    }
  });