const express = require('express');
const multer = require('multer');

const fsSync = require('fs');
const fs      = require('fs').promises;



const session = require('express-session');
const path = require('path');
const axios = require('axios');
const mm = require('music-metadata');

const STREAM_URL   = 'http://192.168.0.23:8000/stream';
const FALLBACK_URL = '/audio/lofi.mp3';

require('dotenv').config();

const app = express();
const PORT = process.env.port || 8080;

// Configuración de sesión
app.use(session({
  secret: 'una-clave-super-secreta',
  resave: false,
  saveUninitialized: true
}));

// Middleware para proteger /admin
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    cb(null, 'program.jpg');
  }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const podcastStorage = multer.diskStorage({
  destination: 'public/uploads/podcast/',
  filename: (req, file, cb) => {
    // Siempre sobreescribe el mismo nombre
    if (file.fieldname === 'image') cb(null, 'img/podcast.jpg');
    else if (file.fieldname === 'audio') cb(null, 'audio/podcast.mp3');
    else cb(null, file.originalname);
  }
});
const uploadPodcast = multer({ storage: podcastStorage });

// Ruta login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if ((username === (process.env.user || 'radioElPilar')) && (password === (process.env.passwd || 'ElPilar2025'))) {
    req.session.loggedIn = true;
    res.redirect('/access.html');
  } else {
    res.send('Credenciales incorrectas. <a href="/login.html">Volver</a>');
  }
});


// Ruta logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Ruta radio
app.get('/radio', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/index.html');
  });
});

app.get('/access', (req, res) => {
  res.redirect('/access.html');
});


// Rutas protegida
app.get('/admin.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/admin-podcast.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-podcast.html'));
});

app.get('/access.html', requireLogin,(req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'access.html'));
});

app.post('/update-program', requireLogin, upload.single('image'), (req, res) => {
  const { title, description } = req.body;
  const data = { title, description, image: '/uploads/program.jpg' };
  fsSync.writeFileSync('data/program.json', JSON.stringify(data, null, 2));
  res.redirect('/admin.html');
});

app.get('/admin-podcast.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-podcast.html'));
});

app.post(
  '/upload-podcast',
  requireLogin,
  uploadPodcast.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  (req, res) => {
    // Campos del formulario
    const { title, description, schedule } = req.body;
    // Guardamos en disco la metadata del podcast
    const podcastData = {
      title,
      description,
      image: '/uploads/podcast/img/podcast.jpg',
      audio: '/uploads/podcast/audio/podcast.mp3',
      schedule // en formato ISO que sale de <input datetime-local>
    };
    fsSync.writeFileSync(
      path.join(__dirname, 'data', 'podcast.json'),
      JSON.stringify(podcastData, null, 2)
    );
    res.redirect('/admin-podcast.html');
  }
);


app.get('/program-info', async (req, res) => {
  try {
    // 1) Intentar directo primero
    try {
      await axios.get(STREAM_URL, { timeout: 10000, responseType: 'stream' });

      // Leer metadata de programa en directo (si existe)
      let prog = { title: 'Emisión en directo', description: '', image: '/images/offstream.png' };
      const progPath = path.join(__dirname, 'data', 'program.json');
      if (fsSync.existsSync(progPath)) {
        prog = JSON.parse(fsSync.readFileSync(progPath, 'utf-8'));
      }

      return res.json({
        mode:         'stream',
        streamActive: true,
        title:        prog.title,
        description:  prog.description,
        image:        prog.image,
        audio:        STREAM_URL,
        serverTime:   new Date().toISOString()
      });
    } catch {
      // no hay directo → seguimos a podcast/fallback
    }

    const podcastPath = path.join(__dirname, 'data', 'podcast.json');

    if (fsSync.existsSync(podcastPath)) {
      const p = JSON.parse(fsSync.readFileSync(podcastPath, 'utf-8'));
      const audioPath = path.join(__dirname, 'public', 'uploads','podcast', 'audio', 'podcast.mp3');
      const nowMs = Date.now();
      const startMs = new Date(p.schedule).getTime();


      // Duración por defecto (1 hora)
      let durationSec = 3600;

    // Intentar leer metadata si el archivo existe
    try {
      await fs.access(audioPath);
      const metadata = await mm.parseFile(audioPath);
      if (typeof metadata.format.duration === 'number') {
        durationSec = Math.floor(metadata.format.duration);
      }
    } catch (err) {
      console.error(`No se pudo leer metadata de ${audioPath}: ${err.message}`);
      // durationSec queda en 3600 si hay error
    }

    const durationMs = durationSec * 1000;

      // Dentro de la ventana del podcast
      if (nowMs >= startMs && nowMs <= startMs + durationMs) {
        return res.json({
          mode:        'podcast',
          title:       p.title,
          description: p.description,
          image:       p.image,
          audio:       p.audio,
          schedule:    p.schedule,
          duration:    durationSec,
          serverTime:  new Date().toISOString()
        });
      }

      // Si está programado para el futuro
      if (nowMs < startMs) {
        // Info offline
        const offlineInfo = {
          title: 'Ez dago zuzeneko emanaldirik',
          description: 'Gozatu gure 24 orduko LoFi kanalaz bitartean',
          image: '/images/offstream.png',
          audio: FALLBACK_URL,
          streamActive: false
        };
        return res.json({
          mode: 'scheduled',
          serverTime: new Date().toISOString(),
          showOnlyInModal: true,
          ...offlineInfo,
          // Propiedades para tu cliente
          title2: p.title,
          description2: p.description,
          image2: p.image,
          audio2: p.audio,
          schedule2: p.schedule,
          durationSeconds: durationSec
        });
      }


      // Si ya pasó la ventana, lo borramos
      if (nowMs > startMs + durationMs) {
        fsSync.unlinkSync(podcastPath);
      }
    }

    // 3) Fallback offline
    return res.json({
      mode:         'fallback',
      streamActive: false,
      title:        'Ez dago zuzeneko emanaldirik',
      description:  'Gozatu gure 24 orduko LoFi kanalaz bitartean',
      image:        '/images/offstream.png',
      audio:        FALLBACK_URL,
      serverTime:   new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno en /program-info' });
  }
});

// POST /clear-podcast: borra podcast.json y los archivos
app.post('/clear-podcast', requireLogin, (req, res) => {
  const podcastPath = path.join(__dirname, 'data', 'podcast.json');
  const imgPath     = path.join(__dirname, 'public', 'uploads', 'podcast','img','podcast.jpg');
  const audPath     = path.join(__dirname, 'public', 'uploads', 'podcast','audio','podcast.mp3');

  try {
    if (fsSync.existsSync(podcastPath)) fsSync.unlinkSync(podcastPath);
    if (fsSync.existsSync(imgPath))     fsSync.unlinkSync(imgPath);
    if (fsSync.existsSync(audPath))     fsSync.unlinkSync(audPath);
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error borrando podcast:', err);
    return res.status(500).json({ error: 'No se pudo limpiar podcast' });
  }
});





app.listen(PORT, () => {
  console.log(`🎧 Radio app protegida en http://localhost:${PORT}`);
});
