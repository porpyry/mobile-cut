"use strict";

/** @this {HTMLElement} */
function openInBackgroundListener(event) {
    let url;
    switch (this.tagName) {
        case "A":
            url = this.href;
            break;
        case "SPAN":
            if (this.parentElement.tagName !== "A") {
                return;
            }
            url = this.parentElement.href;
            break;
        default:
            return;
    }
    event.preventDefault();
    chrome.runtime.sendMessage(null, { type: "cafeDefaultBackground", url });
}

function createClickShieldBox(a, passDefault) {
    if (!a) {
        return;
    }
    if (a.classList.contains("NCOP_CSR")) { // Click Shield Relative
        return a.querySelector("span.NCOP_CSA");
    }
    a.classList.add("NCOP_CSR");
    const span = a.ownerDocument.createElement("span");
    span.classList.add("NCOP_CSA"); // Click Shield Absolute
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
    a.appendChild(span);
    return span;
}

function createClickShieldSpan(spanOrText, passDefault) {
    if (!spanOrText) {
        return;
    }
    let span;
    if (spanOrText.nodeType === Node.ELEMENT_NODE && spanOrText.tagName === "SPAN") {
        span = spanOrText;
    } else if (spanOrText.nodeType === Node.TEXT_NODE) {
        span = spanOrText.ownerDocument.createElement("span");
        spanOrText.parentNode.insertBefore(span, spanOrText);
        span.appendChild(spanOrText);
    } else {
        return;
    }
    if (span.classList.contains("NCOP_CSS")) { // Click Shield Span
        return span;
    }
    span.classList.add("NCOP_CSS");
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
    return span;
}

function setSearchParam(url, param, value) {
    url = new URL(url);
    url.searchParams.set(param, value);
    return url.href;
}

function setCommentFocused(url) {
    return setSearchParam(url, "commentFocus", true);
}

function groupChildrenWithSpan(parent) {
    if (!parent) {
        return;
    }
    let span = parent.querySelector("span.NCOP_GroupSpan");
    if (span) {
        return span;
    }
    span = parent.ownerDocument.createElement("span");
    span.classList.add("NCOP_GroupSpan");
    span.append(...parent.childNodes);
    parent.appendChild(span);
    return span;
}

function isIframeDocumentLoaded(iframe) {
    return iframe
        && iframe.contentDocument?.readyState === "complete"
        && iframe.contentWindow.location.hostname !== "";
}

function replaceHrefToArticleOnly(a) {
    if (!a) {
        return;
    }
    const matches = a.pathname.match(PCArticleURLParser.RE_ARTICLE_NHN);
    if (matches) {
        const searchParams = new URLSearchParams(a.search);
        const cafeId = searchParams.get("clubid");
        const articleId = searchParams.get("articleid");
        if (cafeId && articleId) {
            searchParams.delete("clubid");
            searchParams.delete("articleid");
            const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
            a.href = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
        }
    }
}

async function cleanUpUrlForRefresh(pathname, search) {
    let url;
    const info = PCURLParser.getIframeUrlInfo(pathname, search);
    switch (info?.type) {
        case "cafe-intro":
            {
                const cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                if (cafeName) {
                    url = `https://cafe.naver.com/${cafeName}`;
                }
            } break;
        case "app.article":
            {
                const cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                if (cafeName) {
                    url = `https://cafe.naver.com/${cafeName}/${info.articleId}`;
                }
            } break;
        default:
            {
                let cafeName;
                if (info.cafeId) {
                    cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                } else {
                    cafeName = tryFindCafeNameFromUrl();
                }
                if (cafeName) {
                    const iframeUrl = (pathname + search).replaceAll("&", "%26").replaceAll("#", "%23");
                    url = `https://cafe.naver.com/${cafeName}?iframe_url=${iframeUrl}`; // or iframe_url_utf8=encodeURIComponent(pathname + search)
                }
            } break;
    }
    if (url && location.href !== url) {
        history.replaceState(null, "", url);
    }
}

function tryFindCafeNameFromUrl() {
    const matches = location.pathname.match(/^\/(?<cafeName>\w+)(\/|\.cafe)?$/);
    if (matches) {
        const { cafeName } = matches.groups;
        return cafeName;
    }
}
