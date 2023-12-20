const tabs = await chrome.tabs.query({
    url: [
        "http://*/*",
        "https://*/*"
    ],
});

const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const template = document. getElementById("li_template");
const elements = new Set();
for (const tab of tabs) {
    const element = template.content.firstElementChild.cloneNode(true);

    const favicon = element.querySelector(".favicon");
    favicon.src = tab.favIconUrl;

    const title = tab.title;
    element.querySelector(".title").textContent = title;
    element.querySelector("a").addEventListener("click", async () => {
      // need to focus window as well as the active tab
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    });

    elements.add(element);
}
document.querySelector("ul").append(...elements);