const Path = require('path');
const youtubedl = require('youtube-dl');
const fs = require('fs');

const vttOptions = {
    auto: false,
    all: true,
    format: 'vtt',
    cwd: __dirname + '/vtt'
};

const getVttList = url =>
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

const getVideoFileName = url =>
    new Promise((resolve, reject) => {
        youtubedl.getInfo(url, (err, info) => {
            if (err) reject(err);
            const { display_id, url: download_url } = info;
            resolve([display_id, download_url]);
        });
    });

module.exports = {
    getVttList,
    getVideoFileName
};
