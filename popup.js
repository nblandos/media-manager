async function controlMedia(tabId, website) {
    let code;
    switch (website) {
        case 'soundcloud':
            code = function() {
                const playButton = document.querySelector('.playControl');
                if (playButton) { // Reduce this to a function
                    playButton.click();
                }
            };
            break;
        case 'spotify':
            code = function() {
                const playButton = document.querySelector('.vnCew8qzJq3cVGlYFXRI');
                if (playButton) {
                    playButton.click();
                }
            };
            break;
        default:
            code = function() {
                Array.from(document.querySelectorAll('audio, video')).forEach(media => {
                    if (media.paused) {
                        media.play();
                    } else {
                        media.pause();
                    }
                });
            };
            break;
    }
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

        if (result[0].result) {
            tabsWithMediaPlayer.push(tab);
        }
    }

    // Currently only audible windows are supported
    // If no other solution, store tabs once audible and then update if they are closed.
    const template = document.getElementById("li_template");
    const elements = new Set();
    for (const tab of tabsWithMediaPlayer) {
        const element = template.content.firstElementChild.cloneNode(true);

        const favicon = element.querySelector(".favicon");
        favicon.src = tab.favIconUrl;

        const title = tab.title;

        const playButton = element.querySelector(".play-button");

        if (tab.audible) {
            playButton.classList.add('pause');
        }
        
        playButton.addEventListener("click", async () => {
            let website;
            if (tab.url.includes('soundcloud.com')) {
                website = 'soundcloud';
            } else if (tab.url.includes('spotify.com')) {
                website = 'spotify';
            }
            await controlMedia(tab.id, website);
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
document.addEventListener('DOMContentLoaded', updatePopup);