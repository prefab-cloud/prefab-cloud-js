import { FlagTracker } from "./flagTracker";
// import { prefab } from "./prefab";

export class UiOverlay {
  private flagTracker: FlagTracker;

  private overlayVisible = false;

  constructor(flagTracker: FlagTracker) {
    this.flagTracker = flagTracker;
  }

  init() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && event.key === "F") {
      this.toggleOverlay();
    }
  }

  private toggleOverlay() {
    if (this.overlayVisible) {
      this.hideOverlay();
    } else {
      this.showOverlay();
    }
  }

  private showOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "prefab-flag-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.right = "0";
    overlay.style.width = "300px";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.color = "white";
    overlay.style.zIndex = "10000";
    overlay.style.padding = "10px";
    overlay.style.overflowY = "scroll";

    const flags = this.flagTracker.getFlags();
    const flagList = document.createElement("ul");

    flags.forEach(({ key, value }) => {
      const listItem = document.createElement("li");
      listItem.style.marginBottom = "10px";

      const flagName = document.createElement("span");
      flagName.textContent = key;
      listItem.appendChild(flagName);

      if (typeof value === "boolean") {
        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.checked = value;
        toggle.style.marginLeft = "10px";
        toggle.addEventListener("change", () => {
          // this.flagTracker.updateFlag(key, toggle.checked);
          // prefab.setConfig({ [key]: { value: toggle.checked } });
        });
        listItem.appendChild(toggle);
      } else {
        const flagValue = document.createElement("span");
        flagValue.textContent = `: ${String(value)}`;
        listItem.appendChild(flagValue);
      }

      flagList.appendChild(listItem);
    });

    overlay.appendChild(flagList);
    document.body.appendChild(overlay);
    this.overlayVisible = true;
  }

  private hideOverlay() {
    const overlay = document.getElementById("prefab-flag-overlay");
    if (overlay) {
      document.body.removeChild(overlay);
    }
    this.overlayVisible = false;
  }
}
