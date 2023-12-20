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
}

async function updatePopup() {
    const tabs = await chrome.tabs.query({
        url: [
            "http://*/*",
            "https://*/*"
        ],
        audible: true,
    });
    // Currently only audible windows are supported
    // If no other solution, store tabs once audible and then update if they are closed.

    const collator = new Intl.Collator();
    tabs.sort((a, b) => collator.compare(a.title, b.title));

    const template = document.getElementById("li_template");
    const elements = new Set();
    for (const tab of tabs) {
        const element = template.content.firstElementChild.cloneNode(true);

        const favicon = element.querySelector(".favicon");
        favicon.src = tab.favIconUrl;

        const title = tab.title;

        const playButton = element.querySelector(".play-button");
        playButton.addEventListener("click", async () => {
            let website;
            if (tab.url.includes('soundcloud.com')) {
                website = 'soundcloud';
            } else if (tab.url.includes('spotify.com')) {
                website = 'spotify';
            }
            await controlMedia(tab.id, website);
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