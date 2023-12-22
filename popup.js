async function controlMedia(tabId) {
    let code = function() {
        Array.from(document.querySelectorAll('audio, video')).forEach(media => {
            if (media.paused) {
                media.play();
            } else {
                media.pause();
            }
        });
    };

    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: code
    });

    const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: checkMediaState
    });

    return result[0].result;
}

function checkMediaState() {
    const mediaElements = document.querySelectorAll('audio, video');
    let state = 'paused';
    for (let media of mediaElements) {
        if (!media.paused) {
            state = 'playing';
            break;
        }
    }
    return state;
}

function hasMediaPlayer() {
    const mediaElements = document.querySelectorAll('audio, video');
    return mediaElements.length > 0;
}

async function isMediaPaused(tabId) {
    const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
            const mediaElements = document.querySelectorAll('video, audio');
            for (const media of mediaElements) {
                if (!media.paused) {
                    return false;
                }
            }
            return true;
        }
    });
    return results[0].result;
}

async function updatePlayButton(tabId, playButton) {
    const isPaused = await isMediaPaused(tabId);
    if (!isPaused) {
        playButton.classList.add('pause');
    } else {
        playButton.classList.remove('pause');
    }
}

async function updatePopup() {
    const tabs = await chrome.tabs.query({
        url: [
            "http://*/*",
            "https://*/*"
        ],
    });

    const tabsWithMediaPlayer = [];

    for (const tab of tabs) {
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: hasMediaPlayer
        });
    
        const isYouTube = tab.url.includes('youtube');
        const isWatchOrShorts = tab.url.includes('watch') || tab.url.includes('shorts');
    
        if (result[0].result && (!isYouTube || (isYouTube && isWatchOrShorts))) {
            tabsWithMediaPlayer.push(tab);
        }
    }

    const template = document.getElementById("li_template");
    const elements = new Set();
    for (const tab of tabsWithMediaPlayer) {
        const element = template.content.firstElementChild.cloneNode(true);
        
        const favicon = element.querySelector(".favicon");
        favicon.src = tab.favIconUrl;

        const title = tab.title;

        const playButton = element.querySelector(".play-button");
        playButton.dataset.tabId = tab.id;
        updatePlayButton(tab.id, playButton);
        setInterval(() => updatePlayButton(tab.id, playButton), 500);
        
        playButton.addEventListener("click", async () => {
            await controlMedia(tab.id);
            playButton.classList.toggle('pause');
        });

        element.querySelector(".title").textContent = title;
        element.querySelector("a").addEventListener("click", async () => {
            await chrome.tabs.update(tab.id, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });
        });

        elements.add(element);
    }
    document.querySelector("ul").append(...elements);
}

document.addEventListener("DOMContentLoaded", updatePopup);


