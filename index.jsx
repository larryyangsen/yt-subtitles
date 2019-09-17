import React, { useEffect, useState, useRef } from 'react';
import ReactDom from 'react-dom';
import { useLocation } from 'react-use';
import axios from 'axios';
import parseVtt from './parseVtt';
import 'normalize.css';
import './index.scss';
const parseVideoUrl = window.location.origin + '/parse-video';
const defaultUrl = 'https://www.youtube.com/watch?v=clU8c2fpk2s';

const VttSelector = ({ vttFiles, videoId, onVttChange }) => (
    <select onChange={e => onVttChange(e)}>
        {vttFiles.map((vtt, i) => (
            <option key={i} value={vtt}>
                {vtt.split(videoId + '.')[1].replace('.vtt', '')}
            </option>
        ))}
    </select>
);
const Cues = ({ cues, onCueClick, side = 'left', curHighlightedIndex = -1 }) =>
    cues.map((cue, index) => (
        <div
            className={curHighlightedIndex === index ? 'cue highlight' : 'cue'}
            onClick={() => onCueClick(cue)}
            key={cue.startTime}
            id={side + cue.startTime}
        >
            {cue.text}
        </div>
    ));

const App = () => {
    const { pathname } = location;
    const [vttFiles, setVttFiles] = useState([]);
    const [leftCues, setLeftCues] = useState([]);
    const [rightCues, setRightCues] = useState([]);
    const [url, setUrl] = useState(
        pathname !== '/' ? pathname.split('/')[1] : defaultUrl
    );
    const [error, setError] = useState(null);
    const videoId = useRef('');
    const Video = useRef();
    const [leftHighlightedIndex, setLeftHighlightedIndex] = useState(-1);
    const [rightHighlightedIndex, setRightHighlightedIndex] = useState(-1);
    const preLeftCues = useRef(leftCues);
    const parseVideo = async () => {
        Video.current.src = '';

        videoId.current = '';
        try {
            const {
                data: { display_id, download_url, vttFiles }
            } = await axios.post(parseVideoUrl, {
                url
            });
            if (vttFiles.length) {
                setVttFiles(vttFiles);
                videoId.current = display_id;
                const cues = await parseVtt(vttFiles[0]);
                history.pushState({}, '', `${location.origin}/${display_id}`);
                setLeftCues(cues);
                setRightCues(cues);
            }
            Video.current.src = download_url;
        } catch (err) {
            console.error(err);
            setError(err);
        }
    };

    const onUrlChanged = e => {
        const url = e.target.value;
        setUrl(url);
    };
    const onVttChange = async (e, leftOrRight = 'left') => {
        const vtt = e.target.value;
        const cues = await parseVtt(vtt);
        if (leftOrRight === 'left') {
            setLeftCues([]);
            setLeftCues(cues);
        } else {
            setRightCues([]);
            setRightCues(cues);
        }
        highlightCues(cues);
    };
    const onCueClick = cue => {
        Video.current.currentTime = cue.startTime;
    };

    const highlightCues = (curCues, side = 'left') => {
        const highlightedIndex = curCues.reduce((index, cue, curIndex) => {
            if (Video.current.currentTime >= cue.startTime) {
                return curIndex;
            }
            return index;
        }, -1);
        if (highlightedIndex === -1) return;
        const cue = document.getElementById(
            side + curCues[highlightedIndex].startTime
        );

        cue.scrollIntoView();
        if (side === 'left') {
            setLeftHighlightedIndex(highlightedIndex);
        } else {
            setRightHighlightedIndex(highlightedIndex);
        }
    };
    useEffect(() => {
        setVttFiles([]);
        setLeftCues([]);
        setRightCues([]);
        setLeftHighlightedIndex(-1);
        setRightHighlightedIndex(-1);
        parseVideo();
    }, [url]);

    useEffect(() => {
        if (Video.current && leftCues.length && rightCues.length) {
            preLeftCues.current = leftCues;
            Video.current.ontimeupdate = () => {
                highlightCues(leftCues, 'left');
                highlightCues(rightCues, 'right');
            };
        }
    }, [leftCues, rightCues]);
    if (error) {
        return <div className="error">{error.toString()}</div>;
    }
    return (
        <div className="app">
            <header>
                <input defaultValue={url} onBlur={onUrlChanged} />
            </header>
            <div className="video">
                <video ref={Video} controls autoPlay />
            </div>
            <div className="subtitles">
                {vttFiles.length > 1 && videoId.current && (
                    <div className="vtt-selector">
                        <VttSelector
                            vttFiles={vttFiles}
                            onVttChange={e => onVttChange(e, 'left')}
                            videoId={videoId.current}
                        />
                        <VttSelector
                            vttFiles={vttFiles}
                            onVttChange={e => onVttChange(e, 'right')}
                            videoId={videoId.current}
                        />
                    </div>
                )}
                <div className="vtts">
                    <div className="vtt">
                        <Cues
                            curHighlightedIndex={leftHighlightedIndex}
                            cues={leftCues}
                            onCueClick={onCueClick}
                            side="left"
                        />
                    </div>
                    {vttFiles.length > 1 && (
                        <div className="vtt">
                            <Cues
                                curHighlightedIndex={rightHighlightedIndex}
                                cues={rightCues}
                                onCueClick={onCueClick}
                                side="right"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

ReactDom.render(<App />, document.getElementById('App'));
