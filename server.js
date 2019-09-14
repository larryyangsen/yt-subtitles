const fs = require('fs');
const httpStatus = require('http-status');
const app = require('express')();
const bodyParser = require('body-parser');
const Path = require('path');
const Bundler = require('parcel-bundler');
const { getVttList, getVideoFileName } = require('./youtube');
const isDev = process.env.NODE_ENV === 'dev';
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
        const fileName = await getVideoFileName(url);
        res.status(httpStatus.OK).json({
            vttFiles,
            fileName
        });
    } catch (e) {
        res.status(httpStatus.INSUFFICIENT_STORAGE).send(e);
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

app.get('/video/:fileName', (req, res) => {
    const { fileName } = req.params;
    const video = Path.join(__dirname, 'videos', fileName);
    if (!fs.existsSync(video)) {
        res.status(httpStatus.NOT_FOUND).send(`${fileName} is not found`);
        return;
    }
    res.sendFile(video);
});
if (isDev) {
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
    app.listen(6666, err => {
        if (err) {
            console.error(err);
        }
        console.log('listen on', 6666);
    });
}
