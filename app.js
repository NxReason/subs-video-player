const inputGroups = document.querySelectorAll('.file-input');
inputGroups.forEach(ig => {
  const input = ig.querySelector('input');
  const fileName = ig.querySelector('.file-input-name');

  input.addEventListener('change', e => {
    const { files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      fileName.textContent = file.name;
      fileName.title = file.name;
    }
  });
});

const videoInput = document.getElementById('video-file-input');
const videoPlayer = document.getElementById('video-player');
let videoLoaded = false;
videoInput.addEventListener('change', e => {
  const { files } = e.target;
  if (files.length > 0) {
    const file = files[0];
    const videoUrl = URL.createObjectURL(file);
    videoPlayer.src = videoUrl;
  }
});

videoPlayer.addEventListener('loadedmetadata', () => {
  videoLoaded = true;
});

videoPlayer.addEventListener('timeupdate', () => {
  console.log(videoPlayer.currentTime);
});

const subsInput = document.getElementById('subs-input');
const subsTimeline = document.getElementById('subs-timeline');
const subGroups = [];

subsInput.addEventListener('change', async e => {
  const files = e.target.files;
  if (files.length > 0) {
    const file = files[0];
    const text = await file.text();
    parseSubs(text);
    renderSubs();
  }
});

function parseSubs(text) {
  const lines = text.split('\n');

  let subGroupData = [];
  for (let line of lines) {
    // parse sub group and go to the next one
    if (line.trim() === '') {
      if (subGroupData.length < 3) {
        console.error(
          `Not enough data in the sub group, expected at least 3 lines, got ${subGroupData.length} ${subGroupData}`
        );
        continue;
      }
      const subGroup = new SubGroup(
        subGroupData[0],
        subGroupData[1],
        subGroupData.slice(2)
      );
      subGroups.push(subGroup);
      subGroupData = [];
      continue;
    }

    subGroupData.push(line.trim());
  }
}

function renderSubs() {
  const ul = document.createElement('ul');
  ul.classList.add('sub-group-list');
  const subNodes = subGroups.map(createSubGroupNode);
  ul.append(...subNodes);

  ul.addEventListener('click', e => {
    if (e.target === e.currentTarget) return;

    let childNode = e.target;
    while (childNode.parentNode !== e.currentTarget) {
      childNode = childNode.parentNode;
    }

    const gotoTimestamp = childNode.dataset['timestampSec'];
    if (gotoTimestamp && videoLoaded) {
      videoPlayer.currentTime = parseFloat(gotoTimestamp);
    }
  });

  removeChildNodes(subsTimeline);
  subsTimeline.appendChild(ul);
}

function createSubGroupNode(sg) {
  const li = document.createElement('li');
  li.classList.add('sub-group');
  li.dataset['timestampSec'] = getTimestampInSeconds(sg.timestamp.begin);

  const timestamp = document.createElement('p');
  timestamp.classList.add('sub-group-ts');
  timestamp.textContent = sg.timestamp.begin;
  li.appendChild(timestamp);

  const subTextGroup = document.createElement('div');
  subTextGroup.classList.add('sub-group-text');
  sg.content.forEach(t => {
    const tNode = document.createElement('p');
    tNode.textContent = t;
    subTextGroup.appendChild(tNode);
  });
  li.appendChild(subTextGroup);

  return li;
}

function removeChildNodes(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function getTimestampInSeconds(ts) {
  const [main, msStr] = ts.split('.');
  const [hStr, mStr, sStr] = main.split(':');

  const [h, m, s, ms] = [
    parseInt(hStr),
    parseInt(mStr),
    parseInt(sStr),
    parseInt(msStr),
  ];
  console.log(h, m, s, ms);

  return h * 60 * 60 + m * 60 + s + ms / 100;
}

class SubGroup {
  constructor(number, timestampRaw, content) {
    this.number = number;
    this.timestamp = this.parseTimestamps(timestampRaw);
    this.content = content;
  }

  parseTimestamps(ts) {
    const tsParts = ts.split(' ');
    if (tsParts.length !== 3) {
      console.error(`Wrong timestamp format, expected 3 parts, got "${ts}"`);
      return;
    }
    if (tsParts[1] !== '-->') {
      console.error(
        `Wrong timestamp format, expected [time] --> [time], got ${ts}`
      );
      return;
    }

    const begin = this.formatTimestamp(tsParts[0]);
    const end = this.formatTimestamp(tsParts[2]);
    return { begin, end };
  }

  formatTimestamp(ts) {
    const [sec, ms] = ts.split(',');
    return `${sec}.${ms.slice(0, 2)}`;
  }
}
