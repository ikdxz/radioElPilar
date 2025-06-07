const eliminarBtn = document.getElementById('eliminar');



// Reutiliza la lógica de admin.js para cualquier par drop-zone / file-input
function setupDropZone(dropZoneId, inputId) {
    const dropZone  = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(inputId);

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
  
    // 1) Click en la zona → abre el selector
    dropZone.addEventListener('click', () => fileInput.click());
  
    // 2) Selección tradicional → cambia el texto
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        dropZone.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
      }
    });
  
    // 3) Evitar comportamiento por defecto en drag events
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
      dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  
    // 4) Al arrastrar encima → cambio de estilo
    ['dragenter','dragover'].forEach(evt => {
      dropZone.addEventListener(evt, () => {
        dropZone.style.borderColor      = '#c9289e';
        dropZone.style.backgroundColor  = '#fce4ec';
      });
    });
  
    // 5) Al salir o soltar → restaurar estilo
    ['dragleave','drop'].forEach(evt => {
      dropZone.addEventListener(evt, () => {
        dropZone.style.borderColor     = '';
        dropZone.style.backgroundColor = '';
      });
    });
  
    // 6) Al soltar → asigna el archivo al input real
    dropZone.addEventListener('drop', e => {
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        dropZone.textContent = `Archivo seleccionado: ${e.dataTransfer.files[0].name}`;
      }
    });
  }




  document.addEventListener('DOMContentLoaded', () => {
    setupDropZone('podcast-image-drop', 'podcast-image-input');
    setupDropZone('podcast-audio-drop', 'podcast-audio-input');
  });

  function formatHHMM(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  // Rellenar con ceros a dos dígitos
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getRemainingHHMM(scheduleIso, durationSec) {
  const startMs      = new Date(scheduleIso).getTime();
  const endMs        = startMs + durationSec * 1000;
  const nowMs        = Date.now();
  const remainingMs  = Math.max(0, endMs - nowMs);
  const remainingSec = Math.ceil(remainingMs / 1000);
  return formatHHMM(remainingSec);
}
  

  eliminarBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!confirm('¿Estás seguro de que quieres eliminar el podcast actual?')) return;

    try {
      const resp = await fetch('/clear-podcast', { method: 'POST' });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      // Retroalimentación: recargamos estado y limpiamos formulario si quieres
      alert('Podcast eliminado correctamente.');
    } catch (err) {
      console.error('Error eliminando podcast:', err);
      alert('No se pudo eliminar el podcast. Revisa la consola.');
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
  const btnConsultar = document.getElementById('consultar-hora');
  const overlay      = document.getElementById('modal-overlay');
  const btnClose     = document.getElementById('modal-close');
  const btnOk        = document.getElementById('modal-ok');

  // Campos dentro del modal
  const titleEl     = document.getElementById('modal-title');
  const scheduleEl  = document.getElementById('modal-schedule');
  const durationEl = document.getElementById('modal-duration');
  const remainElclass = document.getElementById('modal-remain2');
  const remainEl = document.getElementById('modal-remain');
  


  // Función para formatear fecha y hora
  // Formatea ISO a texto
  function formatDateTime(iso) {
    const dt   = new Date(iso);
    const dia  = dt.toLocaleDateString('es-ES', {
      weekday:'long', year:'numeric', month:'long', day:'numeric'
    });
    const hora = dt.toLocaleTimeString('es-ES', {
      hour:'2-digit', minute:'2-digit'
    });
    return `${dia}, ${hora}`;
  }

  // Abrir modal y rellenar info
  btnConsultar.addEventListener('click', async () => {
    try {
      const res  = await fetch('/program-info');
      const data = await res.json();
      remainElclass.classList.add('hidden');

      if (data.mode === 'podcast') {
        titleEl.textContent    = data.title;
        scheduleEl.textContent = formatDateTime(data.schedule);
        durationEl.textContent = formatHHMM(data.duration);

        remainElclass.classList.remove('hidden');
        remainEl.textContent   = getRemainingHHMM(data.schedule, data.duration);
      } 

      else if (data.mode === 'scheduled') {
        titleEl.textContent    = data.title2;
        scheduleEl.textContent = formatDateTime(data.schedule2);
        durationEl.textContent  = formatHHMM(data.durationSeconds);


      } else {
        titleEl.textContent    = 'No hay ningún podcast programado';
        scheduleEl.textContent = '-';
        durationEl.textContent = '-';
      }
    } catch (err) {
      titleEl.textContent    = '-';
      scheduleEl.textContent = '-';
      durationEl.textContent = '-';
      remainEl.textContent   = '-';
    }

    // Mostrar modal
    overlay.classList.remove('hidden');
  });

  // Función para cerrar modal
  function closeModal() {
    overlay.classList.add('hidden');
  }

  // Listeners de cierre
  btnClose.addEventListener('click', closeModal);
  btnOk.addEventListener('click',   closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
});
