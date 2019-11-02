import { domainToASCII } from 'url';

var QRCode = require('qrcode')

function initYT() {
  window.gapi.client.setApiKey("AIzaSyBS4PMOVmYxKrJF8kiuGVALbIqGDJIi64k");
  return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
             .then(function() { console.log("GAPI client loaded for API"); },
                   function(err) { console.error("Error loading GAPI client for API", err); });
}

function getQRForVideos(videos, canvas, divid) {      
    var vids=[];
    console.log("input videos ", videos);
    for (var url of videos) {
      console.log("video ...", url);
      var video_id = url.trim();

      if (video_id.indexOf('v=') >0) {
         video_id = url.split('v=')[1];
      } else {
         var idx = video_id.indexOf("youtu.be/");
         if (idx > 0) {
            video_id = video_id.substr(idx+9); 
         }
      }
      console.log("vido is ", video_id);

      var ampersandPosition = video_id.indexOf('&');
      if (ampersandPosition != -1) {
          video_id = video_id.substring(0, ampersandPosition);
      }
      vids.push(video_id);
    }

    var url = 'https://weidongshao.github.io/thepoint-mandarin/yt.html?v=' + vids.join('.');
    console.log("share URL ", url);

    $(divid).html('<h3>Scan this to watch videos</h3>');
    
    QRCode.toCanvas(canvas,  url, function (error) {
        if (error) console.error(error)
        console.log('success!');
    });
}

function YTDurationToSeconds(duration) {
  var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  match = match.slice(1).map(function(x) {
    if (x != null) {
        return x.replace(/\D/, '');
    }
  });

  var hours = (parseInt(match[0]) || 0) +'';
  var minutes = (parseInt(match[1]) || 0) +'';
  var seconds = (parseInt(match[2]) || 0) + '';

  minutes = minutes.padStart(2, '0');
  seconds = seconds.padStart(2, '0');
  
  var dt = minutes + ':' + seconds;
  if (hours) {
      dt = hours + dt;
  }
  return dt;
}
class YTManager {
  constructor(props) {
    this.videos = props.videos.split('.');
    this.divid = props.divid;
    this.createPlayer();
    this.getSnippets();
  }
/*
https://www.googleapis.com/youtube/v3/videos?key=[YOUR API KEY
 HERE]&fields=items(snippet(title,tags,channelTitle,publishedAt),
 statistics(viewCount))&part=snippet,statistics&id=[VIDEOID]*
*/

  getSnippets() {
    var api_key = 'AIzaSyBS4PMOVmYxKrJF8kiuGVALbIqGDJIi64k';
    var id_query = "id=" + this.videos.join('%2C');
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&"
          + id_query + "&key=" + api_key;

    $.ajax({url: url}).done(data => {
            console.log(data);
            for (var video of data.items) {
               var s = video.snippet;
               var title = s.title;
               var tn_img = s.thumbnails.default.url;
               var vid = video.id;
               var duration = YTDurationToSeconds(video.contentDetails.duration);
              $('#snippet').append(
                `<div>
                <span class="badge badge-secondary"> ${title}</span><br>
                <a href="/yt.html?v=${vid}"><img src="${tn_img}" width="120" heigth="90"></a><br>
                Views: ${video.statistics.viewCount}, Duration: ${duration}
                </div>`
              )
            }
      });
    }
  createPlayer() {
    if (this.videos) {
        var vid = this.videos[0];

        player = new window.YT.Player(this.divid, {
          height: '390',
          width: '640',
          
          videoId: vid,
          enablejsapi: 1, 
          events: {
            'onReady': this.onPlayerReady,
            'onStateChange': this.onPlayerStateChange
          }
        });
    } else {

    }
  }

  onPlayerReady(event) {
        event.target.playVideo();
  }
  onPlayerStateChange(event) {
    console.log(event.data);
    if (event.data == YT.PlayerState.PLAYING) {
      window.postMessage("play", "*");
    } else {
      window.postMessage("play", "*");
      if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(event.data);
      }
    }
  }

   stopVideo() {
     player.stopVideo();
   }
}

export { YTManager, initYT, getQRForVideos }