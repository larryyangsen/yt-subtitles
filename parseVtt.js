import vtt from 'vtt.js';
import axios from 'axios';

const { WebVTT } = vtt;
const vttUrl = window.location.origin + '/api/vtt';

const parseVtt = async file => {
    const { data: vtt } = await axios.post(vttUrl, { file });
    const cues = [];
    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
    parser.oncue = cue => {
        cues.push({
            id: cue.id,
            startTime: cue.startTime,
            endTime: cue.endTime,
            highlight: false,
            html: cue.getCueAsHTML(),
            text: cue.text
        });
    };
    parser.parse(vtt);
    parser.flush();
    return cues;
};

export default parseVtt;

export const splitVttLang = (vtt, videoId) =>
    vtt.split(videoId + '.')[1].replace('.vtt', '');

export const extractVtt = async (vttFiles = [], videoId = '') => {
    const vttMap = new Map();
    for (const file of vttFiles) {
        const lang = splitVttLang(file, videoId);
        const { data } = await axios.post(vttUrl, { file });
        vttMap.set(lang, data);
    }
    return vttMap;
};

export const mergeVtt = (...locales) => {
    if (locales.length > 3) throw new Error('locale file max 3');
};