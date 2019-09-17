const fs = require('fs');
const httpStatus = require('http-status');
const express = require('express');
const bodyParser = require('body-parser');
const Path = require('path');
const { getVttList, getVideoFileName } = require('./youtube');
const isDev = process.env.NODE_ENV === 'dev';
const app = express();
app.use(bodyParser.json());

if (!fs.existsSync('vtt')) {
    fs.mkdirSync('./vtt');
}
if (!fs.existsSync('videos')) {
    fs.mkdirSync('./videos');
}

app.post('/parse-video', async (req, res) => {
    const { url = 'https://youtu.be/PizwcirYuGY' } = req.body;
    try {
        const vttFiles = await getVttList(url);
        const [display_id, download_url] = await getVideoFileName(url);
        res.status(httpStatus.OK).json({
            vttFiles,
            display_id,
            download_url
        });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
    }
});

app.post('/vtt', (req, res) => {
    const { file } = req.body;
    if (!fs.existsSync(file)) {
        res.status(404).send(`file: ${file} is not found`);
    }
    const vtt = fs.readFileSync(file, {
        encoding: 'utf-8'
    });
    res.status(httpStatus.OK).send(vtt);
});

if (isDev) {
    const Bundler = require('parcel-bundler');
    const entryFiles = Path.join(__dirname, './index.html');
    const bundler = new Bundler(entryFiles);
    app.use(bundler.middleware());
    app.listen(1234, err => {
        if (err) {
            console.error(err);
        }
        console.log('listen on', 1234);
    });
} else {
    const entryFiles = Path.join(__dirname, '/public');
    const PORT = process.env.PORT || 8080;
    app.use(express.static(entryFiles));
    app.listen(PORT, err => {
        if (err) {
            console.error(err);
        }
        console.log('listen on', PORT);
    });
}
