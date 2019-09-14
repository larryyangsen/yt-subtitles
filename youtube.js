const Path = require('path');
const youtubedl = require('youtube-dl');
const fs = require('fs');

const vttOptions = {
    auto: false,
    all: true,
    format: 'vtt',
    cwd: __dirname + '/vtt'
};
const videoOptions = {
    cwd: __dirname + '/videos'
};

const getVttList = async url =>
    new Promise((resolve, reject) => {
        youtubedl.getSubs(url, vttOptions, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            if (!files) {
                resolve([]);
                return;
            }
            resolve(files.map(file => `vtt/${file}`));
        });
    });

const getVideoFileName = async url =>
    new Promise((resolve, reject) => {
        youtubedl.getInfo(url, (err, info) => {
            if (err) reject(err);
            const { display_id } = info;
            const fileName = display_id + '.mp4';
            const output = Path.join('videos', fileName);
            if (fs.existsSync(output)) {
                resolve(fileName);
                return;
            }

            const video = youtubedl(url);
            const writer = fs.createWriteStream(output);
            video.pipe(writer);
            video.on('end', () => {
                resolve(fileName);
            });
        });
    });

module.exports = {
    getVttList,
    getVideoFileName
};
