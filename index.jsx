import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef
} from 'react';
import ReactDom from 'react-dom';
import axios from 'axios';
import { extractVtt, splitVttName } from './parseVtt';
import 'normalize.css';
import './index.scss';
const parseVideoUrl = window.location.origin + '/api/parse-video';
const defaultUrl = 'https://www.youtube.com/watch?v=clU8c2fpk2s';
const url = new URL(location.href);
const defaultLang = navigator.language;

const App = () => {
    const id = url.searchParams.get('id');
    const [vttMap, setVttMap] = useState(new Map());
    const [displayId, setDisplayId] = useState('');
    const [selectedVtts, setSelectedVtts] = useState([]);
    const onVttChange = index => {
        Video.current.textTracks[index].mode === 'showing'
            ? (Video.current.textTracks[index].mode = 'disabled')
            : (Video.current.textTracks[index].mode = 'showing');
        console.log(index);
    };
    const tracks = useMemo(() => {
        if (!vttMap.size) {
            return [<track key="0" />];
        }
        const tracks = [];
        vttMap.forEach((vtt, key = '') => {
            const url = window.URL.createObjectURL(new Blob([vtt]));
            tracks.push(
                <track
                    key={key}
                    srcLang={key}
                    src={url}
                    default={key === defaultLang}
                />
            );
        });
        return tracks;
    }, [vttMap]);

    const VttSelector = useMemo(() => {
        if (tracks.length === 1) {
            return <div />;
        }
        return (
            <div className="vtt-selector">
                {tracks.map((track, i) => (
                    <label key={i}>
                        <input
                            onChange={() => onVttChange(i)}
                            value={i}
                            type="checkbox"
                            defaultChecked={track.key === defaultLang}
                        />
                        {track.props.srcLang}
                    </label>
                ))}
            </div>
        );
    }, [tracks]);
    const [ytUrl, setYtUrl] = useState(() => id ?? '');
    const [error, setError] = useState(null);
    const Video = useRef();

    const parseVideo = useCallback(async () => {
        if (!ytUrl) return;
        Video.current.src = '';
        try {
            const {
                data: { display_id, download_url, vttFiles }
            } = await axios.post(parseVideoUrl, {
                url: ytUrl
            });
            setDisplayId(display_id);
            if (vttFiles.length) {
                const vttMap = await extractVtt(vttFiles, display_id);
                setVttMap(vttMap);
                const params = url.searchParams;
                params.set('id', display_id);
                url.search = params;
                history.pushState({}, '', url);
            }
            Video.current.src = download_url;
        } catch (err) {
            console.error(err.response);
            setError(err);
        }
    }, [ytUrl]);

    const onUrlChanged = e => {
        const url = e.target.value;
        if (url) setYtUrl(url);
    };

    useEffect(() => {
        setVttMap(new Map());
        parseVideo();
    }, [ytUrl]);

    if (error) {
        return <div className="error">{error.toString()}</div>;
    }
    return (
        <div className="app">
            <header>
                <input defaultValue={ytUrl} onBlur={onUrlChanged} />
            </header>
            <video ref={Video} controls autoPlay>
                {tracks}
            </video>
            {VttSelector}
        </div>
    );
};
document.createElement;

ReactDom.render(<App />, document.body);
