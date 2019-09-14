import React, { useEffect, useState, useRef } from 'react';
import ReactDom from 'react-dom';
import axios from 'axios';
import parseVtt from './parseVtt';
import 'normalize.css';
import './index.scss';
const parseVideoUrl = window.location.origin + '/parse-video';
const videoUrl = window.location.origin + '/video';
const defaultUrl = 'https://www.youtube.com/watch?v=clU8c2fpk2s';

const App = () => {
    const [vttFiles, setVttFiles] = useState([]);
    const [curCues, setCurCues] = useState([]);
    const [url, setUrl] = useState(defaultUrl);
    const videoFileName = useRef('');
    const Video = useRef();
    const curHighlightedIndex = useRef(-1);
    const preCues = useRef(curCues);
    const parseVideo = async () => {
        Video.current.src = '';
        setVttFiles([]);
        setCurCues([]);
        const {
            data: { fileName, vttFiles }
        } = await axios.post(parseVideoUrl, {
            url
        });
        if (vttFiles.length) {
            setVttFiles(vttFiles);
            videoFileName.current = fileName;
            console.log(fileName);
            const cues = await parseVtt(vttFiles[0]);
            setCurCues(cues);
        }
        Video.current.src = `${videoUrl}/${fileName}`;
    };

    const onUrlChanged = e => {
        const url = e.target.value;
        setUrl(url);
    };
    const onVttClick = async vtt => {
        setCurCues([]);
        const cues = await parseVtt(vtt);
        setCurCues(cues);
        highlightCues();
    };
    const onCueClick = cue => {
        Video.current.currentTime = cue.startTime;
    };

    const highlightCues = curCues => {
        curHighlightedIndex.current = curCues.reduce((index, cue, curIndex) => {
            if (Video.current.currentTime >= cue.startTime) {
                return curIndex;
            }
            return index;
        }, -1);
        if (curHighlightedIndex.current === -1) return;
        setCurCues(curCues => {
            const cue = document.getElementById(
                curCues[curHighlightedIndex.current].startTime
            );
            cue.scrollIntoView();
            return curCues.map((cue, index) => ({
                ...cue,
                highlight: index <= curHighlightedIndex.current
            }));
        });
    };
    useEffect(() => {
        parseVideo();
    }, [url]);

    useEffect(() => {
        if (
            Video.current &&
            curCues.map(cue => cue.startTime).join() !==
                preCues.current.map(cue => cue.startTime).join()
        ) {
            preCues.current = curCues;
            Video.current.ontimeupdate = () => highlightCues(curCues);
        }
    }, [curCues]);

    return (
        <div className="app">
            <header>
                <input defaultValue={url} onBlur={onUrlChanged} />
            </header>
            <div className="video">
                <video ref={Video} controls autoPlay />
            </div>
            <div className="subtitles">
                <div className="vtt-list">
                    {vttFiles.map((vtt, i) => (
                        <div
                            onClick={() => onVttClick(vtt)}
                            key={i}
                            className="vtt-file"
                        >
                            {vtt.split(
                                videoFileName.current.replace('.mp4', '')
                            )[1]}
                        </div>
                    ))}
                </div>

                <div className="vtt">
                    {curCues.map(cue => (
                        <div
                            className={cue.highlight ? 'cue highlight' : 'cue'}
                            onClick={() => onCueClick(cue)}
                            key={cue.startTime}
                            id={cue.startTime}
                        >
                            {cue.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ReactDom.render(<App />, document.getElementById('App'));
