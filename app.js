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
// TODO:

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

  removeChildNodes(subsTimeline);
  subsTimeline.appendChild(ul);
}

function createSubGroupNode(sg) {
  const li = document.createElement('li');
  li.classList.add('sub-group');

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

class SubGroup {
  constructor(number, timestampRaw, content) {
    this.number = number;
    this.timestamp = this.parseTimestamp(timestampRaw);
    this.content = content;
  }

  parseTimestamp(ts) {
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
    return { begin: tsParts[0], end: tsParts[1] };
  }
}
