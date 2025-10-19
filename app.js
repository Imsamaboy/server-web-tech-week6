export default function initApp(express, bodyParser, createReadStream, crypto, http) {
    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');
        if (!req.path.endsWith('/')) {
            res.redirect(301, req.path + '/');
        } else {
            next();
        }
    });

    app.get('/login/', (req, res) => {
        res.send('99803203-b584-4d0c-a62e-0e9704ea6563');
    });

    app.get('/code/', (req, res) => {
        const path = decodeURI(import.meta.url.substring(7));
        createReadStream(path).pipe(res);
    });

    app.get('/sha1/:input/', (req, res) => {
        const hash = crypto.createHash('sha1').update(req.params.input).digest('hex');
        res.send(hash);
    });

    app.all(['/req/', '/req'], (req, res) => {
        const addr = req.method === 'GET' ? req.query.addr : req.body.addr;
        if (!addr) {
            res.status(400).send('addr parameter is required');
            return;
        }
        http.get(addr, (resp) => {
            resp.pipe(res);
        }).on('error', () => {
            res.status(500).send('Error fetching resource');
        });
    });

    app.all(/.*/, (req, res) => {
        res.send('99803203-b584-4d0c-a62e-0e9704ea6563');
    });

    return app;
}
