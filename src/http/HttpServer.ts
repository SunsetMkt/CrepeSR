import express from 'express';
import https from 'https';
import fs from 'fs';
import { resolve } from 'path';
import Config from '../util/Config';
import Logger, { VerboseLevel } from '../util/Logger';
const c = new Logger("HTTP");

function r(...args: string[]) {
    return fs.readFileSync(resolve(__dirname, ...args)).toString();
}

const HTTPS_CONFIG = {
    key: r('./cert/cert.key'),
    cert: r('./cert/cert.crt'),
}

export default class HttpServer {
    private readonly server;

    public constructor() {
        this.server = express();
        this.server.use(express.json()); 
        this.server.route('/*').all((req, res) => {
            if (Logger.VERBOSE_LEVEL > VerboseLevel.WARNS) c.log(`${req.method} ${req.url}`);
            import(`./routes${req.url.split('?')[0]}`).then(async r => {
                await r.default(req, res);
            }).catch(err => {
                res.send({
                    code: 0
                });
                if (err.code === 'MODULE_NOT_FOUND') return;
                c.error(err);
            });
        });
        
        https.createServer(HTTPS_CONFIG, this.server).listen(Config.HTTP.HTTP_PORT, Config.HTTP.HTTP_PORT);
        this.server.listen(80, Config.HTTP.HTTP_HOST, () => {
            c.log(`Listening on ${Config.HTTP.HTTP_HOST}:${Config.HTTP.HTTP_PORT}`);
        });
    }
}