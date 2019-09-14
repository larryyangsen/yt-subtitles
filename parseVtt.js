import vtt from 'vtt.js';
import axios from 'axios';

const { WebVTT } = vtt;
const vttUrl = window.location.origin + '/vtt';

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
