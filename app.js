export default function appSrc(express, bodyParser, createReadStream, crypto, http, mongo, https, pug, puppeteer) {
  const app = express();
  const LOGIN = "99803203-b584-4d0c-a62e-0e9704ea6563";

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'x-test,ngrok-skip-browser-warning,Content-Type,Accept,Access-Control-Allow-Headers');
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const bodyStr = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const length = res.getHeader('content-length') ?? '-';
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${length} - ${durationMs}ms ${bodyStr}`);
    });
    next();
  });

  app.get("/login/", (_req, res) => {
    res.set('Content-Type', 'text/plain; charset=UTF-8').send(LOGIN);
  });

  app.get('/code/', (req, res) => {
    res.set('Content-Type', 'text/plain; charset=UTF-8');
    const filepath = import.meta.url.substring(7);
    const stream = createReadStream(filepath);
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  });

  app.get('/sha1/:input/', (req, res) => {
    const { input } = req.params;
    const hash = crypto.createHash('sha1').update(input).digest('hex');
    res.send(hash);
  });

  app.get('/req/', (req, res) => {
    const addr = typeof req.query.addr === 'string' ? req.query.addr : undefined;
    if (!addr) return res.status(400).send('Bad Request');
    http
      .get(addr, (r) => {
        if (r.statusCode) res.status(r.statusCode);
        r.on('error', () => res.status(502).end());
        r.pipe(res);
      })
      .on('error', () => res.status(502).end());
  });

  app.post('/req/', (req, res) => {
    const addr = typeof req.body?.addr === 'string' ? req.body.addr : undefined;
    if (!addr) return res.status(400).send('Bad Request');
    http
      .get(addr, (r) => {
        if (r.statusCode) res.status(r.statusCode);
        r.on('error', () => res.status(502).end());
        r.pipe(res);
      })
      .on('error', () => res.status(502).end());
  });

  app.post('/insert/', async (req, res) => {
    const login = req.body.login;
    const password = req.body.password;
    const URL = req.body.URL;
    if (!login || !password || !URL || !mongo) return res.status(400).send('Bad Request');
    let client;
    try {
      client = await new mongo.MongoClient(URL, { useNewUrlParser: true, useUnifiedTopology: true }).connect();
      const db = client.db();
      const users = db.collection('users');
      await users.insertOne({ login, password });
      res.status(201).send('OK');
    } catch (err) {
      res.status(500).send('Server Error' + err.message);
    } finally {
      if (client) await client.close();
    }
  });

  app.get('/test/', async (req, res) => {
    const target = req.query.URL;
    if (!target || !puppeteer) return res.status(400).send('Bad Request');
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();
      await page.goto(target, { waitUntil: 'networkidle2' });
      await page.click('#bt');
      const value = await page.$eval('#inp', (el) => el.value || '');
      res.set('Content-Type', 'text/plain; charset=UTF-8');
      res.send(String(value ?? ''));
    } catch (err) {
      res.status(500).send('Server Error');
    } finally {
      if (browser) await browser.close();
    }
  });

  app.use('/wordpress/', (req, res) => {
    const base = process.env.WORDPRESS_BASE;
    const target = new URL(req.url, base).toString();

    const proxyReq = http.get(target, (r) => {
      res.statusCode = r.statusCode || 502;
      if (r.headers['content-type']) {
        res.setHeader('Content-Type', r.headers['content-type']);
      }
      r.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.status(502).end();
    });
  });

  app.post('/render/', (req, res) => {
    const addr = typeof req.query.addr === 'string' ? req.query.addr : undefined;
    const { random2, random3 } = req.body || {};
    if (!addr || !pug) return res.status(400).send('Bad Request');
    const isHttps = addr.startsWith('https');
    const client = isHttps && https ? https : http;
    const fetchReq = client.get(addr, (r) => {
      if (r.statusCode && r.statusCode >= 400) return res.status(r.statusCode).end();
      let data = '';
      r.setEncoding('utf8');
      r.on('data', (chunk) => { data += chunk; });
      r.on('end', () => {
        try {
          const tpl = pug.compile(data);
          const html = tpl({ random2, random3 });
          res.set('Content-Type', 'text/html; charset=UTF-8');
          res.send(html);
        } catch (_) {
          res.status(500).send('Server Error');
        }
      });
    });
    fetchReq.on('error', () => res.status(502).end());
  });

  app.use((err, req, res, next) => {
    console.error(err && err.stack ? err.stack : err);
    if (res.headersSent) return next(err);
    res.status(500).send('Internal Server Error');
  });

  app.all(/.*/,(req, res) => {

  })

  return app;
}