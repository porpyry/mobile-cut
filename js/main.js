"use strict";

(async () => {
    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }

    const monitor = new Monitor(options);

    const functionNodeIndexList = [
        OnFoundArticle.getIndex(options),
        OnFoundArticleList.getIndex(options),
        OnFoundArticleSearchList.getIndex(options),
        OnFoundCafe.getIndex(options),
        OnFoundCafeIntro.getIndex(options),
        OnFoundDocument.getIndex(options),
        OnFoundMember.getIndex(options),
        OnFoundPopular.getIndex(options)
    ];

    for (const functionNodeIndex of functionNodeIndexList) {
        for (const [key, functionNode, isValid] of functionNodeIndex) {
            if (!functionNode) {
                throw new Error("NaverCafeOnlyPC: Invalid function node.");
            }
            if (isValid) {
                monitor.on(key, functionNode);
            }
        }
    }

    monitor.ready();

    window.addEventListener("DOMContentLoaded", () => {
        monitor.call("document", document);
    });
})();
