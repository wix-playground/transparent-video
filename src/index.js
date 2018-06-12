import VideoGL from './videogl';

/*const VIDEOS = [
    'v-1920x1080-30fps.mp4',
    'v-1920x1080-60fps.mp4',
    'https://s3-eu-west-1.amazonaws.com/ireland-video-output/alpha/v-1920x1080-60fps.mp4',
    'https://video.wixstatic.com/video/009625_5b77713f4bde47aba5cc4a10ac338a3e/720p/mp4/file.mp4',
    'https://video.wixstatic.com/video/009625_088cc86915dc48339a2eb45f2228243e/720p/mp4/file.mp4',
    'https://video.wixstatic.com/video/009625_e36aceb51ed54720b773181b6fdcea7e/1080p/mp4/file.mp4',
    'https://video.wixstatic.com/video/009625_2deb597f00324997adb15dc1c2938231/1080p/mp4/file.mp4',
    'https://video.wixstatic.com/video/009625_0b86fc986afb49efa2a3322d12f9d9b5/480p/mp4/file.mp4'
];*/

main();

function main () {
    const videogl = new VideoGL();
    const canvas = document.getElementById('target');
    const video = document.getElementById('video');
    const [, width, height, src] = window.location.search.match(/\?(\d+)\|(\d+)\|(.*)/);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    video.src = `https://video.wixstatic.com/video/${decodeURIComponent(src)}/mp4/file.mp4`;

    videogl.target(canvas);
    videogl.source(video);

    let playing = false;
    let timeupdate = false;

    video.addEventListener('playing', isPlaying, true);
    video.addEventListener('timeupdate', isTimeupdate, true);
    video.addEventListener('canplay', () => video.play(), true);

    function isPlaying () {
        playing = true;
        video.removeEventListener('playing', isPlaying, true);
        check();
    }
    function isTimeupdate () {
        timeupdate = true;
        video.removeEventListener('timeupdate', isTimeupdate, true);
        check();
    }

    function check () {
        if (playing && timeupdate) {
            videogl.go();
        }
    }
}
