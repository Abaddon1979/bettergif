import { withPluginApi } from "discourse/lib/plugin-api";
import { getURL } from "discourse-common/lib/get-url";

export default {
  name: "chatgif-initializer",

  initialize() {
    withPluginApi("0.11.7", (api) => {
      const siteSettings = api.container.lookup("site-settings:main");

      if (siteSettings && siteSettings.chatgif_enabled === false) {
        return;
      }

      const normalizePath = (u) => {
        try {
          const url = new URL(u, window.location.origin);
          return url.pathname.replace(/\/+$/, "");
        } catch (_e) {
          return (u || "").replace(/https?:\/\/[^/]+/, "").replace(/\/+$/, "");
        }
      };


      const processChatForDuplicateLinkPreviews = (root = document) => {
        const anchors = Array.from(
          root.querySelectorAll?.(
            '.chat-message a[href], .chat-message-container a[href], .tc-message a[href], .cooked a[href], a.onebox[href]'
          ) || []
        );
        anchors.forEach((a) => {
          const href = a.getAttribute('href') || '';
          const isImageLike =
            /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(href) ||
            href.includes('tenor.com') ||
            href.includes('giphy.com') ||
            href.includes('klipy.com') ||
            href.includes('media.tenor.com') ||
            href.includes('media.giphy.com') ||
            href.includes('static.klipy.com');

          const imgInside = a.querySelector('img');

          const messageEl =
            a.closest('.chat-message, .chat-message-container, .chat-message-text, .message, .tc-message, .cooked') || a.parentElement;


          const imgsInMsg = Array.from(messageEl?.querySelectorAll?.('img[src]') || []);
          const hrefPath = normalizePath(href);
          const hasSameImage = imgsInMsg.some((img) => {
            const src = img.getAttribute('src') || '';
            const srcPath = normalizePath(src);
            return (
              src === href ||
              srcPath === hrefPath ||
              srcPath.endsWith(hrefPath) ||
              hrefPath.endsWith(srcPath)
            );
          });

          if (isImageLike) {
            const hideCaret = () => {
              const maybeCarets = [
                a.previousElementSibling,
                a.nextElementSibling,
                ...(messageEl?.querySelectorAll?.('svg.d-icon-caret-right') || []),
              ].filter(Boolean);
              maybeCarets.forEach((el) => {
                if (el && el.tagName === 'SVG' && el.classList.contains('d-icon-caret-right')) {
                  el.style.display = 'none';
                  el.classList.add('chatgif-hidden-caret');
                }
              });
            };

            if (imgInside) {
              a.replaceWith(imgInside);
              hideCaret();
            } else if (hasSameImage) {
              a.style.display = 'none';
              a.classList.add('chatgif-hidden-onebox');
              hideCaret();
            }
          }
        });

        const msgContainers = Array.from(
          root.querySelectorAll?.('.chat-message, .chat-message-container, .chat-message-text, .message, .tc-message, .cooked') || []
        );
        msgContainers.forEach((msg) => {
          const hasHiddenOnebox = !!msg.querySelector('a.chatgif-hidden-onebox');
          const imgs = Array.from(msg.querySelectorAll('img[src]') || []);
          const hasGifLikeImg = imgs.some((img) => {
            const src = img.getAttribute('src') || '';
            return /\.gif(\?.*)?$/i.test(src) || /tenor|giphy|klipy/i.test(src);
          });
          if (hasHiddenOnebox || hasGifLikeImg || imgs.length > 0) {
            const collapser = msg.querySelector('.chat-message-collapser');
            if (collapser) {
              collapser.style.display = 'block';
              collapser.style.visibility = 'visible';
              collapser.style.opacity = '1';
              collapser.style.width = 'auto';
              collapser.style.height = 'auto';
              collapser.style.maxHeight = 'none';
              collapser.style.overflow = 'visible';
              collapser.classList.remove('chatgif-hidden-caret');
            }

            const collapserBody = msg.querySelector('.chat-message-collapser-body');
            if (collapserBody) {
              collapserBody.style.display = 'block';
              collapserBody.style.visibility = 'visible';
              collapserBody.style.opacity = '1';
              collapserBody.style.height = 'auto';
              collapserBody.style.maxHeight = 'none';
              collapserBody.style.overflow = 'visible';
            }

            const collapserHeader = msg.querySelector('.chat-message-collapser-header');
            if (collapserHeader) {
              collapserHeader.style.display = 'none';
              collapserHeader.style.visibility = 'hidden';
              collapserHeader.style.height = '0';
              collapserHeader.style.margin = '0';
              collapserHeader.style.padding = '0';
            }


            const contentContainers = [
              msg.querySelector('.chat-message-text'),
              msg.querySelector('.message-content'),
              msg.querySelector('.onebox'),
              msg
            ].filter(Boolean);

            contentContainers.forEach(container => {
              if (container) {
                container.style.display = 'block';
                container.style.visibility = 'visible';
                container.style.height = 'auto';
                container.style.maxHeight = 'none';
                container.style.overflow = 'visible';
                container.classList.remove('is-collapsed', 'is-onebox-collapsed');
                container.removeAttribute('data-onebox-collapsed');
              }
            });

            imgs.forEach(img => {
              img.style.display = 'block';
              img.style.visibility = 'visible';
              img.style.opacity = '1';
            });

            const caretSelectors = [
              'svg.d-icon-caret-right',
              '.d-icon-caret-right',
              'svg.d-icon-caret-down',
              '.d-icon-caret-down',
              'svg.d-icon-caret-up',
              '.d-icon-caret-up',
              'svg.d-icon-caret-left',
              '.d-icon-caret-left',
              'svg[class*="caret"]',
              '.d-icon[class*="caret"]'
            ];

            msg.querySelectorAll(caretSelectors.join(',')).forEach((el) => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.classList.add('chatgif-hidden-caret');
            });

            const collapserButtons = msg.querySelectorAll(
              'button.chat-message-collapser-button, button.chat-message-collapser-opened, button.chat-message-collapser-closed, button[class*="collapser"]'
            );
            collapserButtons.forEach((btn) => {
              btn.style.display = 'none';
              btn.style.visibility = 'hidden';
              btn.classList.add('chatgif-hidden-caret');
              btn.setAttribute('aria-hidden', 'true');

              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }, { capture: true });
            });

            const collapserLink = msg.querySelector('.chat-message-collapser-link-small');
            if (collapserLink) {
              collapserLink.style.display = 'none';
            }
          }
        });
      };

      processChatForDuplicateLinkPreviews(document);

      const attachPreviewToComposer = (inputEl) => {
        if (!inputEl || inputEl.dataset.chatgifPreviewAttached) return;
        inputEl.dataset.chatgifPreviewAttached = "true";

        const container = inputEl.closest(".chat-composer__input-container");
        if (!container) return;

        let preview = container.querySelector(".chatgif-inline-preview");
        if (!preview) {
          preview = document.createElement("div");
          preview.className = "chatgif-inline-preview";
          preview.style.display = "none";
          if (inputEl.nextSibling) {
            container.insertBefore(preview, inputEl);
          } else {
            container.appendChild(preview);
          }
        }

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const isImageUrl = (u) => /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);

        const updatePreview = () => {
          // Skip preview on mobile (GIF auto-posts anyway)
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth < 768;
          if (isMobile) {
            return; // No preview needed on mobile
          }

          let value = inputEl.value || "";

          const mdMatch = value.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
          if (mdMatch && mdMatch[1]) {
            inputEl.dataset.chatgifHiddenUrl = mdMatch[1];
            value = value
              .replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g, "")
              .replace(/\s{2,}/g, " ")
              .trimStart();
            inputEl.value = value;
          }

          const urls = (value.match(urlRegex) || []).filter(isImageUrl);
          const candidate = inputEl.dataset.chatgifHiddenUrl || urls[0];

          preview.innerHTML = "";
          if (!candidate) {
            preview.style.display = "none";
            container.classList.remove("chatgif-has-preview");
            container.style.removeProperty("--chatgif-preview-h");
            inputEl.style.color = ""; // Restore text color for normal typing
            return;
          }
          const u = candidate;

          if (urls[0] && value.includes(urls[0]) && inputEl.dataset.chatgifHiddenUrl !== urls[0]) {
            inputEl.dataset.chatgifHiddenUrl = urls[0];
            /* Don't hide URL - let it stay in textarea so user can backspace to delete
            // Remove URL and invisible characters
            let textOnly = value.replace(urls[0], "").replace(/\u200E/g, "").replace(/\s{2,}/g, " ").trim();

            if (textOnly && !textOnly.endsWith("\n")) {
              textOnly = textOnly + "\n";
            } else if (!textOnly) {
              // Use space + invisible character to prevent blank message error
              textOnly = " \u200E";
            }
            inputEl.value = textOnly;
            */
          }

          // Create preview that looks like it's inside textarea (rich text effect)
          const img = document.createElement("img");
          img.src = u;
          img.alt = "GIF";
          img.loading = "lazy";
          img.style.maxHeight = "120px";
          img.style.width = "auto";
          img.style.maxWidth = "100%";
          img.style.display = "block";
          img.style.margin = "4px 0";
          preview.appendChild(img);
          preview.style.display = "block";

          // Hide the URL text in textarea by making it transparent
          inputEl.style.color = "transparent";

          // Enable send button when we have a GIF URL
          const sendBtn = container.closest(".chat-composer__inner-container")?.querySelector(".chat-composer-button.-send");
          if (sendBtn) {
            sendBtn.removeAttribute("disabled");
            sendBtn.setAttribute("tabindex", "0");
          }
        };

        inputEl.addEventListener("input", updatePreview);
        inputEl.addEventListener("paste", () => setTimeout(updatePreview, 0));

        // Monitor send button and re-enable it if needed (for mobile where Discourse keeps re-disabling)
        const ensureSendBtnEnabled = () => {
          if (inputEl.dataset.chatgifHiddenUrl) {
            const sendBtn = container.closest(".chat-composer__inner-container")?.querySelector(".chat-composer-button.-send");
            if (sendBtn && sendBtn.hasAttribute("disabled")) {
              sendBtn.removeAttribute("disabled");
              sendBtn.setAttribute("tabindex", "0");
            }
          }
        };

        // Check periodically on mobile
        setInterval(ensureSendBtnEnabled, 100);


        const appendHiddenUrlBeforeSend = (opts = {}) => {
          const { triggerSendClick = false, triggerKeyEnter = false } = opts;
          if (inputEl.dataset.chatgifSendingNow === "1") return;
          inputEl.dataset.chatgifSendingNow = "1";
          container.classList.add("chatgif-sending");
          const hidden = inputEl.dataset.chatgifHiddenUrl;
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const isImageUrl = (u) => /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);

          const current = inputEl.value || "";
          const foundUrls = (current.match(urlRegex) || []).filter(isImageUrl);
          const all = Array.from(new Set([...(hidden ? [hidden] : []), ...foundUrls]));

          // Remove URLs and invisible characters before checking if there's actual text
          let textOnly = current.replace(urlRegex, "").replace(/\u200E/g, "").replace(/\s{2,}/g, " ").trim();

          const parts = [];
          if (textOnly) parts.push(textOnly);
          all.forEach(url => parts.push(url));
          const combinedValue = parts.join("\n");

          console.log("[ChatGIF] Before send:");
          console.log("  Text only:", textOnly);
          console.log("  URLs:", all);
          console.log("  Combined value:", combinedValue);

          console.log("[ChatGIF] Before send:");
          console.log("  Text only:", textOnly);
          console.log("  URLs:", all);
          console.log("  Combined value:", combinedValue);

          inputEl.value = combinedValue;

          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));

          inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
          inputEl.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));

          setTimeout(() => {
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          }, 50);
          const composerRootEl = container.closest(".chat-composer__inner-container") || document;
          let sendBtnEl = composerRootEl.querySelector(".chat-composer-button.-send, button[aria-label='Send'], button[title='Send'], .chat-composer__send-button, .tc-composer__send, button[type='submit']");
          if (triggerSendClick) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    console.log("[ChatGIF] Sending now, value is:", inputEl.value);
                    try {
                      if (sendBtnEl) {
                        sendBtnEl.click();
                      } else {
                        const formEl = container.closest("form");
                        if (formEl) {
                          if (typeof formEl.requestSubmit === "function") {
                            formEl.requestSubmit();
                          } else {
                            formEl.submit();
                          }
                        }
                      }
                    } catch (_e) { }
                  }, 200);
                });
              });
            });
          }

          const start = Date.now();
          const clearAll = () => {
            delete inputEl.dataset.chatgifHiddenUrl;
            preview.style.display = "none";
            preview.innerHTML = "";
            container.classList.remove("chatgif-has-preview");
            container.classList.remove("chatgif-sending");
            container.style.removeProperty("--chatgif-preview-h");
            delete inputEl.dataset.chatgifSuppressEnter;
            delete inputEl.dataset.chatgifSendingNow;
          };
          const iv = setInterval(() => {
            if (!inputEl || (inputEl.value || "").trim() === "") {
              clearInterval(iv);
              clearAll();
            } else if (Date.now() - start > 2500) {
              clearInterval(iv);
              clearAll();
            }
          }, 50);
        };

        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            if (inputEl.dataset.chatgifDispatchingEnter === "1") {
              delete inputEl.dataset.chatgifDispatchingEnter;
              delete inputEl.dataset.chatgifSuppressEnter;
              return;
            }
            if (!e.shiftKey && !e.isComposing) {
              const current = inputEl.value || "";
              const urls = (current.match(urlRegex) || []).filter(isImageUrl);
              // Also trigger if we have the placeholder (space + invisible char) with a hidden URL
              const hasPlaceholder = /^\s*\u200E\s*$/.test(current);
              if (inputEl.dataset.chatgifHiddenUrl || urls.length || (hasPlaceholder && inputEl.dataset.chatgifHiddenUrl)) {
                if (inputEl.dataset.chatgifSendingNow === "1") return;

                // Prevent ALL enter processing
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                inputEl.dataset.chatgifSuppressEnter = "1";
                appendHiddenUrlBeforeSend({ triggerSendClick: true, triggerKeyEnter: false });
                return;
              }
            }
          }
        });

        inputEl.addEventListener("keyup", (e) => {
          if (e.key === "Enter" && inputEl.dataset.chatgifSuppressEnter === "1") {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        });
        inputEl.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && inputEl.dataset.chatgifSuppressEnter === "1") {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        });

        const composerRoot = container.closest(".chat-composer__inner-container");
        const sendBtn = composerRoot?.querySelector(".chat-composer-button.-send");
        if (sendBtn && !sendBtn.dataset.chatgifHooked) {
          sendBtn.dataset.chatgifHooked = "true";

          // Enable send button when we have a GIF (override Discourse's disabled state)
          if (inputEl.dataset.chatgifHiddenUrl) {
            sendBtn.removeAttribute("disabled");
            sendBtn.setAttribute("tabindex", "0");
          }

          sendBtn.addEventListener("click", (e) => {
            // If we have a hidden URL, set value before Discourse processes the click
            if (inputEl.dataset.chatgifHiddenUrl) {
              const hidden = inputEl.dataset.chatgifHiddenUrl;
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const isImageUrl = (u) => /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);

              const current = inputEl.value || "";
              const foundUrls = (current.match(urlRegex) || []).filter(isImageUrl);
              const all = Array.from(new Set([...(hidden ? [hidden] : []), ...foundUrls]));

              // Remove URLs and invisible characters
              let textOnly = current.replace(urlRegex, "").replace(/\u200E/g, "").replace(/\s{2,}/g, " ").trim();

              const parts = [];
              if (textOnly) parts.push(textOnly);
              all.forEach(url => parts.push(url));
              const combinedValue = parts.join("\n");

              // Set value synchronously - Discourse's handler will see this
              inputEl.value = combinedValue;

              // Dispatch input event so Discourse updates
              inputEl.dispatchEvent(new Event("input", { bubbles: true }));

              // Clear dataset
              delete inputEl.dataset.chatgifHiddenUrl;

              // Clear preview and restore text color
              preview.style.display = "none";
              preview.innerHTML = "";
              container.classList.remove("chatgif-has-preview");
              inputEl.style.color = "";

              // Let the click proceed - Discourse will send the message
            }
          }, { capture: true });

          // Handle touch event for mobile
          sendBtn.addEventListener("touchend", (e) => {
            if (inputEl.dataset.chatgifHiddenUrl) {
              const hidden = inputEl.dataset.chatgifHiddenUrl;
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const isImageUrl = (u) => /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(u);

              const current = inputEl.value || "";
              const foundUrls = (current.match(urlRegex) || []).filter(isImageUrl);
              const all = Array.from(new Set([...(hidden ? [hidden] : []), ...foundUrls]));

              let textOnly = current.replace(urlRegex, "").replace(/\u200E/g, "").replace(/\s{2,}/g, " ").trim();

              const parts = [];
              if (textOnly) parts.push(textOnly);
              all.forEach(url => parts.push(url));

              inputEl.value = parts.join("\n");
              inputEl.dispatchEvent(new Event("input", { bubbles: true }));
              delete inputEl.dataset.chatgifHiddenUrl;

              // Clear preview and restore text color
              preview.style.display = "none";
              preview.innerHTML = "";
              container.classList.remove("chatgif-has-preview");
              inputEl.style.color = "";
            }
          }, { capture: true });
        }

        updatePreview();
      };


      const initExistingInputs = () => {
        document
          .querySelectorAll(".chat-composer__input")
          .forEach((el) => attachPreviewToComposer(el));
      };
      initExistingInputs();

      const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes || []) {
            if (!(node instanceof HTMLElement)) continue;
            if (node.matches && node.matches(".chat-composer__input")) {
              attachPreviewToComposer(node);
            }
            node
              .querySelectorAll?.(".chat-composer__input")
              .forEach((el) => attachPreviewToComposer(el));

            processChatForDuplicateLinkPreviews(node);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });

      const csrfToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.content || "";

      const debounce = (fn, wait = 300) => {
        let t;
        return (...args) => {
          clearTimeout(t);
          t = setTimeout(() => fn(...args), wait);
        };
      };

      const isMobileDevice = () =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;

      const fileUrlFromFormat = (fmt) => {
        if (!fmt) return null;
        if (typeof fmt === "string") return fmt;
        return fmt.url || null;
      };

      const extractGifUrls = (item) => {
        const file = item.file || item.files || {};
        const fromSize = (size) => {
          const sized = file[size];
          if (!sized) return null;
          return (
            fileUrlFromFormat(sized.gif) ||
            fileUrlFromFormat(sized.webp) ||
            fileUrlFromFormat(sized.mp4)
          );
        };

        const preview =
          fromSize("md") ||
          fromSize("sm") ||
          fromSize("xs") ||
          fromSize("hd") ||
          fileUrlFromFormat(file.gif) ||
          fileUrlFromFormat(file.webp);
        const original =
          fromSize("hd") ||
          fromSize("md") ||
          fromSize("sm") ||
          fileUrlFromFormat(file.gif) ||
          preview;

        return { preview, original };
      };

      const normalizeItems = (payload) => {
        const rows = payload?.data?.data || payload?.results || [];
        return rows
          .map((item) => {
            if (item?.type === "ad") {
              return {
                kind: "ad",
                content: item.content || "",
                width: item.width || 300,
                height: item.height || 250,
                title: "Ad",
              };
            }

            const { preview, original } = extractGifUrls(item);
            if (!preview && !original) return null;

            return {
              kind: "gif",
              slug: item.slug || "",
              title: item.title || item.content_description || "GIF",
              preview: preview || original,
              original: original || preview,
            };
          })
          .filter(Boolean);
      };

      const registerShare = (slug, query) => {
        if (!slug) return;
        const body = { slug };
        if (query) body.q = query;

        fetch(getURL("/chatgif/share"), {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken(),
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(body),
        }).catch(() => {});
      };

      const insertGifIntoChat = (gifUrl) => {
        const textarea = document.querySelector(".chat-composer__input");
        if (!textarea) return;

        const currentValue = textarea.value || "";
        textarea.dataset.chatgifHiddenUrl = gifUrl;

        if (currentValue.trim()) {
          if (!currentValue.endsWith("\n")) {
            textarea.value = currentValue + "\n";
          }
        } else if (isMobileDevice()) {
          textarea.value = gifUrl;
        } else {
          textarea.value = "";
        }

        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        if (isMobileDevice()) {
          setTimeout(() => {
            document.querySelector(".chat-composer-button.-send")?.click();
          }, 100);
        } else {
          textarea.focus();
          const textLength = textarea.value.length;
          textarea.setSelectionRange(textLength, textLength);
        }
      };

      const ensurePicker = (onPickGif) => {
        let backdrop = document.getElementById("chatgif-backdrop");
        if (!backdrop) {
          backdrop = document.createElement("div");
          backdrop.id = "chatgif-backdrop";
          backdrop.className = "chatgif-backdrop";
          document.body.appendChild(backdrop);
        }

        let gifPicker = document.getElementById("chatgif-picker");
        if (gifPicker) {
          gifPicker._chatgifOnPick = onPickGif;
          return { gifPicker, backdrop };
        }

        gifPicker = document.createElement("div");
        gifPicker.id = "chatgif-picker";
        gifPicker.className = "chatgif-picker";
        gifPicker.style.display = "none";
        gifPicker.innerHTML = `
          <div class="chatgif-search">
            <input type="text" placeholder="Search KLIPY" class="chatgif-search-input" autocomplete="off">
          </div>
          <div class="chatgif-powered-by">Powered by KLIPY</div>
          <div class="chatgif-results"></div>
          <div class="chatgif-loading" style="display: none;">Loading...</div>
        `;
        document.body.appendChild(gifPicker);
        gifPicker._chatgifOnPick = onPickGif;

        const searchInput = gifPicker.querySelector(".chatgif-search-input");
        const resultsContainer = gifPicker.querySelector(".chatgif-results");
        const loadingIndicator = gifPicker.querySelector(".chatgif-loading");
        const poweredBy = gifPicker.querySelector(".chatgif-powered-by");

        let currentQuery = "";
        let nextPage = 1;
        let hasNext = false;
        let loading = false;
        let abortController = null;
        let mode = "trending"; // trending | search | recent

        const renderError = (msg) => {
          resultsContainer.innerHTML = `<div class="chatgif-error">${msg}</div>`;
        };

        const appendItem = (item) => {
          const el = document.createElement("div");
          el.className =
            item.kind === "ad" ? "chatgif-item chatgif-item--ad" : "chatgif-item";

          if (item.kind === "ad") {
            el.innerHTML = `
              <div class="chatgif-ad-badge">Ad</div>
              <iframe
                class="chatgif-ad-frame"
                title="Advertisement"
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                loading="lazy"
              ></iframe>
            `;
            const frame = el.querySelector("iframe");
            frame.srcdoc = item.content || "";
            if (item.width && item.height) {
              frame.style.aspectRatio = `${item.width} / ${item.height}`;
            }
          } else {
            el.innerHTML = `
              <img src="${item.preview}" alt="${(item.title || "GIF").replace(/"/g, "&quot;")}" loading="lazy">
            `;
            el.addEventListener("click", () => {
              registerShare(item.slug, mode === "search" ? currentQuery : "");
              const pick = gifPicker._chatgifOnPick;
              if (typeof pick === "function") {
                pick(item.original, item);
              }
              gifPicker.style.display = "none";
              backdrop.classList.remove("visible");
            });
          }

          resultsContainer.appendChild(el);
        };

        const fetchPage = async ({ append = false } = {}) => {
          if (loading) return;

          try {
            abortController?.abort();
          } catch (_e) {}
          abortController = new AbortController();

          loading = true;
          loadingIndicator.style.display = "block";

          const page = append ? nextPage : 1;
          let endpoint;
          if (mode === "search") {
            endpoint = getURL(
              `/chatgif/search?q=${encodeURIComponent(currentQuery)}&page=${page}`
            );
          } else if (mode === "recent") {
            endpoint = getURL(`/chatgif/recent?page=${page}`);
          } else {
            endpoint = getURL(`/chatgif/trending?page=${page}`);
          }

          try {
            const resp = await fetch(endpoint, {
              credentials: "same-origin",
              headers: { "X-Requested-With": "XMLHttpRequest" },
              signal: abortController.signal,
            });

            if (!resp.ok) {
              const text = await resp.text();
              let message = `KLIPY HTTP ${resp.status}`;
              try {
                const parsed = JSON.parse(text);
                message = parsed.error || parsed.message || message;
              } catch (_e) {}
              throw new Error(message);
            }

            const data = await resp.json();
            const items = normalizeItems(data);
            hasNext = !!(data?.data?.has_next);
            nextPage = hasNext ? page + 1 : page;

            if (!append) {
              resultsContainer.innerHTML = "";
            }

            if (items.length === 0 && !append) {
              resultsContainer.innerHTML =
                '<div class="chatgif-no-results">No GIFs found</div>';
              if (poweredBy) poweredBy.style.display = "block";
            } else {
              if (poweredBy && items.length > 0) poweredBy.style.display = "none";
              items.forEach(appendItem);
            }
          } catch (e) {
            if (e?.name !== "AbortError") {
              if (!append) {
                renderError(`Failed to load GIFs: ${e.message}`);
              }
            }
          } finally {
            loading = false;
            loadingIndicator.style.display = "none";
          }
        };

        const performSearch = (append = false) => {
          const query = searchInput.value.trim();
          if (!query) {
            mode = "trending";
            currentQuery = "";
            if (!append) {
              nextPage = 1;
              hasNext = false;
            }
            return fetchPage({ append });
          }

          mode = "search";
          if (!append || query !== currentQuery) {
            currentQuery = query;
            nextPage = 1;
            hasNext = false;
            resultsContainer.innerHTML = "";
          }
          return fetchPage({ append });
        };

        searchInput.addEventListener(
          "input",
          debounce(() => performSearch(false), 300)
        );

        resultsContainer.addEventListener("scroll", () => {
          const nearBottom =
            resultsContainer.scrollTop + resultsContainer.clientHeight >=
            resultsContainer.scrollHeight - 100;
          if (nearBottom && !loading && hasNext) {
            fetchPage({ append: true });
          }
        });

        backdrop.addEventListener("click", () => {
          gifPicker.style.display = "none";
          backdrop.classList.remove("visible");
        });

        gifPicker._chatgifReload = () => performSearch(false);

        return { gifPicker, backdrop };
      };

      const togglePicker = (onPickGif) => {
        const { gifPicker, backdrop } = ensurePicker(onPickGif);
        const isVisible = gifPicker.style.display === "block";
        gifPicker.style.display = isVisible ? "none" : "block";

        if (isVisible) {
          backdrop.classList.remove("visible");
          return;
        }

        backdrop.classList.add("visible");
        const input = gifPicker.querySelector(".chatgif-search-input");
        input.focus();
        if (typeof gifPicker._chatgifReload === "function") {
          gifPicker._chatgifReload();
        }
      };

      api.registerChatComposerButton({
        id: "chatgif",
        icon: "film",
        label: "chatgif.insert",
        position: "dropdown",
        action: () => {
          if (!document.querySelector(".chat-composer__inner-container")) return;
          togglePicker((gifUrl) => insertGifIntoChat(gifUrl));
        },
      });

      api.onToolbarCreate((toolbar) => {
        toolbar.addButton({
          id: "insert_gif_button",
          group: "extras",
          icon: "film",
          label: "chatgif.insert",
          title: "chatgif.insert",
          perform: (e) => {
            togglePicker((gifUrl) => {
              const chatTextarea = document.querySelector(".chat-composer__input");
              if (chatTextarea && chatTextarea.offsetParent !== null) {
                insertGifIntoChat(gifUrl);
                return;
              }
              e.addText(`![](${gifUrl})`);
            });
          },
        });
      });
    });
  },
};
