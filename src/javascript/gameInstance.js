import DropTrack from "./track";
import YoutubePlayer from "./youtube";
import { saveToLocal, loadFromLocal } from "./storage";
import { loadFromDemo } from "./demo";

export default class GameInstance {
  constructor(vm) {
    this.canvas = vm.canvas;
    this.ctx = vm.ctx;
    this.audio = vm.audio;
    this.vm = vm;

    this.timeArr = [];
    this.timeArrIdx = 0;

    // time elapsed relative to audio play time (+Number(vm.noteSpeedInSec))
    this.playTime = 0;

    // init play tracks
    this.dropTrackArr = [];

    this.trackNum = 4;
    this.trackKeyBind = ["d", "f", "j", "k"];
    this.trackMaxWidth = 150;

    // clock for counting time
    this.intervalPlay = null;

    this.ytPlayer = new YoutubePlayer(vm);

    // init

    for (const keyBind of this.trackKeyBind) {
      this.dropTrackArr.push(new DropTrack(vm, this, 0, this.trackMaxWidth, keyBind));
    }

    this.reposition();

    this.registerInput();

    // start animate
    this.destoryed = false;
    this.update();
  }

  reposition() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const trackWidth =
      this.canvas.width / this.trackNum > this.trackMaxWidth
        ? this.trackMaxWidth
        : this.canvas.width / this.trackNum;
    const startX = this.canvas.width / 2 - (this.trackNum * trackWidth) / 2;

    for (let counter = 0; counter < this.dropTrackArr.length; counter++) {
      const trackWidthWithOffset = trackWidth + 1;
      this.dropTrackArr[counter].resizeTrack(startX + trackWidthWithOffset * counter, trackWidth);
    }

    this.vm.checkHitLineY = (this.canvas.height / 10) * 9;
    this.vm.noteSpeedPxPerSec = this.vm.checkHitLineY / Number(this.vm.noteSpeedInSec);
  }

  registerInput() {
    window.addEventListener("resize", (_) => {
      this.reposition();
    });

    document.addEventListener(
      "keydown",
      (event) => {
        this.onKeyDown(event.key);
      },
      false
    );

    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        for (let c = 0; c < e.changedTouches.length; c++) {
          // touchInf[e.changedTouches[c].identifier] = {"x":e.changedTouches[c].clientX,"y":e.changedTouches[c].clientY};
          const x = event.changedTouches[c].clientX;

          this.dropTrackArr.forEach((track) => {
            if (x > track.x && x < track.x + track.width) {
              this.onKeyDown(track.keyBind);
            }
          });
        }
      },
      false
    );
  }

  // log key and touch events
  async onKeyDown(key) {
    if (!this.vm.playMode) {
      const cTime = await this.getCurrentTime();
      if (this.trackKeyBind.includes(key)) this.timeArr.push({ time: cTime, key });
    }
    for (const track of this.dropTrackArr) {
      track.keyDown(key);
    }
  }

  // animate all
  update() {
    if (this.destoryed) return;
    requestAnimationFrame(this.update.bind(this));
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.vm.visualizerInstance.renderVisualizer();
    for (const track of this.dropTrackArr) {
      track.update();
    }
  }

  playGame() {
    this.resetPlaying();
    const startTime = Date.now();
    this.vm.playMode = true;

    const intervalPrePlay = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      this.playTime = Number(elapsedTime / 1000);
      if (this.playTime > Number(this.vm.noteSpeedInSec)) {
        try {
          if (this.vm.srcMode === "url") {
            this.audio.play();
          } else if (this.vm.srcMode === "youtube") {
            this.ytPlayer.playVideo();
          }
        } catch (e) {
          console.error(e);
        }
        // this.vm.visualizerInstance.initAllVisualizersIfRequried();
        clearInterval(intervalPrePlay);
        this.intervalPlay = setInterval(async () => {
          const cTime = await this.getCurrentTime();
          this.playTime = cTime + Number(this.vm.noteSpeedInSec);
        }, 100);
      }
    }, 100);
  }

  getCurrentTime() {
    // it seems that 'getPlayerTime' is async, thus all places calling this func need to await res [help wanted]
    return this.vm.srcMode === "youtube"
      ? this.ytPlayer.getPlayerTime()
      : this.audio.getCurrentTime();
  }

  resetPlaying(resetTimeArr) {
    clearInterval(this.intervalPlay);
    this.ytPlayer.resetVideo();
    if (resetTimeArr) this.timeArr = [];
    this.timeArrIdx = 0;
    this.playTime = 0;
    this.vm.playMode = false;
    this.audio.stop();
  }

  startSong(song) {
    this.resetPlaying(true);
    this.vm.currentSong = song.url;
    this.vm.srcMode = song.srcMode;
    this.timeArr = song.sheet;
    this.vm.visualizerInstance.visualizer = song.visualizerNo !== null ? song.visualizerNo : 0;
    if (song.srcMode === "youtube") {
      this.loadYoutubeVideo(song.youtubeId);
    }
    this.playGame();
  }

  destroyInstance() {
    this.destoryed = true;
    this.resetPlaying();
  }

  // local storage
  saveCurrentTimeArrToLocal(name) {
    saveToLocal(name, this.timeArr);
  }

  loadTimeArrFromLocal(name) {
    this.timeArr = loadFromLocal(name);
  }

  loadTimeArrFromDemo(name) {
    this.timeArr = loadFromDemo(name);
  }

  // youtube
  playVideo() {
    this.ytPlayer.playVideo();
  }

  loadYoutubeVideo(id) {
    this.ytPlayer.loadYoutubeVideo(id);
  }
}
