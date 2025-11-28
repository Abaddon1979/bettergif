import { withPluginApi } from "discourse/lib/plugin-api";
import { action } from "@ember/object";
import { getURL } from "discourse-common/lib/get-url";

export default {
  name: "chatgif-initializer",

  initialize(container) {
    withPluginApi("0.11.7", (api) => {
      const siteSettings = api.container.lookup("site-settings:main");

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
            href.includes('media.tenor.com') ||
            href.includes('media.giphy.com');

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
            return /\.gif(\?.*)?$/i.test(src) || /tenor|giphy/i.test(src);
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
            return;
          }
          const u = candidate;

          if (urls[0] && value.includes(urls[0]) && inputEl.dataset.chatgifHiddenUrl !== urls[0]) {
            inputEl.dataset.chatgifHiddenUrl = urls[0];
            // Remove URL and invisible characters
            let textOnly = value.replace(urls[0], "").replace(/\u200E/g, "").replace(/\s{2,}/g, " ").trim();

            if (textOnly && !textOnly.endsWith("\n")) {
              textOnly = textOnly + "\n";
            } else if (!textOnly) {
              // Use space + invisible character to prevent blank message error
              textOnly = " \u200E";
            }
            inputEl.value = textOnly;
          }

          const img = document.createElement("img");
          img.src = u;
          img.alt = "preview";
          img.loading = "lazy";
          img.style.maxHeight = "120px";
          img.style.width = "auto";
          img.style.maxWidth = "100%";
          img.addEventListener("load", () => {
          });
          preview.appendChild(img);
          preview.style.display = "block";
        };

        inputEl.addEventListener("input", updatePreview);
        inputEl.addEventListener("paste", () => setTimeout(updatePreview, 0));

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
          sendBtn.addEventListener("mousedown", () => appendHiddenUrlBeforeSend({ triggerSendClick: false }));
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

      api.registerChatComposerButton({
        id: "chatgif",
        icon: "film",
        label: "chatgif.insert",
        position: "dropdown",
        action: (context) => {
          const composerElement = document.querySelector(".chat-composer__inner-container");
          if (!composerElement) return;


          let backdrop = document.getElementById("chatgif-backdrop");
          if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "chatgif-backdrop";
            backdrop.className = "chatgif-backdrop";
            document.body.appendChild(backdrop);
          }


          let gifPicker = document.getElementById("chatgif-picker");

          if (!gifPicker) {
            gifPicker = document.createElement("div");
            gifPicker.id = "chatgif-picker";
            gifPicker.className = "chatgif-picker";
            gifPicker.style.display = "none";
            gifPicker.innerHTML = `
              <div class="chatgif-search">
                <input type="text" placeholder="Search GIFs..." class="chatgif-search-input">
              </div>
              <div class="chatgif-powered-by">Powered by Tenor</div>
              <div class="chatgif-results"></div>
              <div class="chatgif-loading" style="display: none;">Loading...</div>
            `;

            document.body.appendChild(gifPicker);

            const searchInput = gifPicker.querySelector(".chatgif-search-input");
            const resultsContainer = gifPicker.querySelector(".chatgif-results");
            const loadingIndicator = gifPicker.querySelector(".chatgif-loading");
            const poweredBy = gifPicker.querySelector(".chatgif-powered-by");
            let currentQuery = "";
            let nextPos = "";
            let loading = false;
            let abortController = null;
            const debounce = (fn, wait = 300) => {
              let t;
              return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), wait);
              };
            };

            const performSearch = async (append = false) => {
              const query = searchInput.value.trim();
              if (!query) {
                if (!append) {
                  resultsContainer.innerHTML = "";
                  nextPos = "";
                  if (poweredBy) poweredBy.style.display = "block";
                }
                loadingIndicator.style.display = "none";
                return;
              }
              if (!append || query !== currentQuery) {
                currentQuery = query;
                nextPos = "";
                resultsContainer.innerHTML = "";
              }
              try {
                abortController?.abort();
              } catch (_e) { }
              abortController = new AbortController();

              loading = true;
              loadingIndicator.style.display = "block";

              const renderError = (msg) => {
                if (!append) {
                  resultsContainer.innerHTML = `<div class="chatgif-error">${msg}</div>`;
                }
              };

              const apiKey = (siteSettings && siteSettings.chatgif_tenor_api_key) || "";
              if (!apiKey) {
                loading = false;
                loadingIndicator.style.display = "none";
                renderError("Tenor API key not configured. Set it in Admin → Settings → Plugins → chatgif_tenor_api_key");
                return;
              }

              const baseUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
                query
              )}&key=${encodeURIComponent(apiKey)}&client_key=discourse_chatgif&limit=24&media_filter=gif&contentfilter=high`;
              const url = append && nextPos ? `${baseUrl}&pos=${encodeURIComponent(nextPos)}` : baseUrl;

              try {
                const resp = await fetch(url, { signal: abortController.signal });
                if (!resp.ok) {
                  const t = await resp.text();
                  throw new Error(`Tenor HTTP ${resp.status}: ${t.slice(0, 120)}`);
                }
                const data = await resp.json();
                loadingIndicator.style.display = "none";
                const gifs = data.results || [];
                if (poweredBy && gifs.length > 0) poweredBy.style.display = "none";
                if (!append && gifs.length === 0) {
                  resultsContainer.innerHTML = '<div class="chatgif-no-results">No GIFs found</div>';
                  if (poweredBy) poweredBy.style.display = "block";
                } else {
                  gifs.forEach((gif) => {
                    const gifElement = document.createElement("div");
                    gifElement.className = "chatgif-item";
                    gifElement.innerHTML = `
                      <img src="${gif.media_formats.gif.url}" alt="${gif.content_description}" loading="lazy">
                    `;
                    gifElement.addEventListener("click", () => {
                      const textarea = document.querySelector(".chat-composer__input");
                      if (textarea) {
                        const gifUrl = gif.media_formats.gif.url;
                        const currentValue = textarea.value || "";

                        // Store the GIF URL in dataset
                        textarea.dataset.chatgifHiddenUrl = gifUrl;

                        // If there's existing text, just add a space/newline
                        if (currentValue.trim()) {
                          if (!currentValue.endsWith("\n")) {
                            textarea.value = currentValue + "\n";
                          }
                        } else {
                          // Use space + invisible character to pass validation
                          textarea.value = " \u200E";
                        }

                        textarea.dispatchEvent(new Event("input", { bubbles: true }));
                        textarea.focus();

                        // Position cursor at the end
                        const textLength = textarea.value.length;
                        textarea.setSelectionRange(textLength, textLength);
                      }
                      gifPicker.style.display = "none";
                      backdrop.classList.remove("visible");
                    });
                    resultsContainer.appendChild(gifElement);
                  });
                }
                nextPos = data.next || "";
              } catch (e) {
                if (e?.name === "AbortError") {
                } else {
                  loadingIndicator.style.display = "none";
                  renderError(`Failed to load GIFs: ${e.message}`);
                }
              } finally {
                loading = false;
              }
            };

            searchInput.addEventListener("input", debounce(() => performSearch(false), 300));
            resultsContainer.addEventListener("scroll", () => {
              const nearBottom =
                resultsContainer.scrollTop + resultsContainer.clientHeight >=
                resultsContainer.scrollHeight - 100;
              if (nearBottom && !loading && nextPos) {
                performSearch(true);
              }
            });


            backdrop.addEventListener("click", () => {
              gifPicker.style.display = "none";
              backdrop.classList.remove("visible");
            });
          }


          const isVisible = gifPicker.style.display === "block";
          gifPicker.style.display = isVisible ? "none" : "block";

          if (isVisible) {
            backdrop.classList.remove("visible");
          } else {
            backdrop.classList.add("visible");
            gifPicker.querySelector(".chatgif-search-input").focus();
          }
        }
      });

      // Add GIF picker button to forum post composer toolbar
      api.onToolbarCreate((toolbar) => {
        toolbar.addButton({
          id: "insert_gif_button",
          group: "extras",
          icon: "film",
          label: "chatgif.insert",
          title: "chatgif.insert",
          perform: (e) => {
            const composerElement = document.querySelector(".d-editor-container");
            if (!composerElement) return;

            let backdrop = document.getElementById("chatgif-backdrop");
            if (!backdrop) {
              backdrop = document.createElement("div");
              backdrop.id = "chatgif-backdrop";
              backdrop.className = "chatgif-backdrop";
              document.body.appendChild(backdrop);
            }

            let gifPicker = document.getElementById("chatgif-picker");

            // Reuse the same picker created for chat, but update click handler
            if (!gifPicker) {
              // Create the picker (same as chat)
              gifPicker = document.createElement("div");
              gifPicker.id = "chatgif-picker";
              gifPicker.className = "chatgif-picker";
              gifPicker.style.display = "none";
              gifPicker.innerHTML = `
                <div class="chatgif-search">
                  <input type="text" placeholder="Search GIFs..." class="chatgif-search-input">
                </div>
                <div class="chatgif-powered-by">Powered by Tenor</div>
                <div class="chatgif-results"></div>
                <div class="chatgif-loading" style="display: none;">Loading...</div>
              `;

              document.body.appendChild(gifPicker);

              const searchInput = gifPicker.querySelector(".chatgif-search-input");
              const resultsContainer = gifPicker.querySelector(".chatgif-results");
              const loadingIndicator = gifPicker.querySelector(".chatgif-loading");
              const poweredBy = gifPicker.querySelector(".chatgif-powered-by");
              let currentQuery = "";
              let nextPos = "";
              let loading = false;
              let abortController = null;
              const debounce = (fn, wait = 300) => {
                let t;
                return (...args) => {
                  clearTimeout(t);
                  t = setTimeout(() => fn(...args), wait);
                };
              };

              const performSearch = async (append = false) => {
                const query = searchInput.value.trim();
                if (!query) {
                  if (!append) {
                    resultsContainer.innerHTML = "";
                    nextPos = "";
                    if (poweredBy) poweredBy.style.display = "block";
                  }
                  loadingIndicator.style.display = "none";
                  return;
                }
                if (!append || query !== currentQuery) {
                  currentQuery = query;
                  nextPos = "";
                  resultsContainer.innerHTML = "";
                }
                try {
                  abortController?.abort();
                } catch (_e) { }
                abortController = new AbortController();

                loading = true;
                loadingIndicator.style.display = "block";

                const renderError = (msg) => {
                  if (!append) {
                    resultsContainer.innerHTML = `<div class="chatgif-error">${msg}</div>`;
                  }
                };

                const apiKey = (siteSettings && siteSettings.chatgif_tenor_api_key) || "";
                if (!apiKey) {
                  loading = false;
                  loadingIndicator.style.display = "none";
                  renderError("Tenor API key not configured. Set it in Admin → Settings → Plugins → chatgif_tenor_api_key");
                  return;
                }

                const baseUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
                  query
                )}&key=${encodeURIComponent(apiKey)}&client_key=discourse_chatgif&limit=24&media_filter=gif&contentfilter=high`;
                const url = append && nextPos ? `${baseUrl}&pos=${encodeURIComponent(nextPos)}` : baseUrl;

                try {
                  const resp = await fetch(url, { signal: abortController.signal });
                  if (!resp.ok) {
                    const t = await resp.text();
                    throw new Error(`Tenor HTTP ${resp.status}: ${t.slice(0, 120)}`);
                  }
                  const data = await resp.json();
                  loadingIndicator.style.display = "none";
                  const gifs = data.results || [];
                  if (poweredBy && gifs.length > 0) poweredBy.style.display = "none";
                  if (!append && gifs.length === 0) {
                    resultsContainer.innerHTML = '<div class="chatgif-no-results">No GIFs found</div>';
                    if (poweredBy) poweredBy.style.display = "block";
                  } else {
                    gifs.forEach((gif) => {
                      const gifElement = document.createElement("div");
                      gifElement.className = "chatgif-item";
                      gifElement.innerHTML = `
                        <img src="${gif.media_formats.gif.url}" alt="${gif.content_description}" loading="lazy">
                      `;
                      gifElement.addEventListener("click", () => {
                        const gifUrl = gif.media_formats.gif.url;

                        // Check if we're in chat or forum composer
                        const chatTextarea = document.querySelector(".chat-composer__input");
                        const forumTextarea = document.querySelector(".d-editor-input");

                        if (chatTextarea && chatTextarea.offsetParent !== null) {
                          // Chat composer logic
                          const currentValue = chatTextarea.value || "";
                          chatTextarea.dataset.chatgifHiddenUrl = gifUrl;

                          if (currentValue.trim()) {
                            if (!currentValue.endsWith("\n")) {
                              chatTextarea.value = currentValue + "\n";
                            }
                          } else {
                            // Use space + invisible character to pass validation
                            chatTextarea.value = " \u200E";
                          }

                          chatTextarea.dispatchEvent(new Event("input", { bubbles: true }));
                          chatTextarea.focus();
                          const textLength = chatTextarea.value.length;
                          chatTextarea.setSelectionRange(textLength, textLength);
                        } else if (forumTextarea) {
                          // Forum composer logic - insert markdown image
                          const markdown = `![](${gifUrl})`;
                          e.addText(markdown);
                        }

                        gifPicker.style.display = "none";
                        backdrop.classList.remove("visible");
                      });
                      resultsContainer.appendChild(gifElement);
                    });
                  }
                  nextPos = data.next || "";
                } catch (error) {
                  if (error?.name === "AbortError") {
                  } else {
                    loadingIndicator.style.display = "none";
                    renderError(`Failed to load GIFs: ${error.message}`);
                  }
                } finally {
                  loading = false;
                }
              };

              searchInput.addEventListener("input", debounce(() => performSearch(false), 300));
              resultsContainer.addEventListener("scroll", () => {
                const nearBottom =
                  resultsContainer.scrollTop + resultsContainer.clientHeight >=
                  resultsContainer.scrollHeight - 100;
                if (nearBottom && !loading && nextPos) {
                  performSearch(true);
                }
              });

              backdrop.addEventListener("click", () => {
                gifPicker.style.display = "none";
                backdrop.classList.remove("visible");
              });
            }

            const isVisible = gifPicker.style.display === "block";
            gifPicker.style.display = isVisible ? "none" : "block";

            if (isVisible) {
              backdrop.classList.remove("visible");
            } else {
              backdrop.classList.add("visible");
              gifPicker.querySelector(".chatgif-search-input").focus();
            }
          }
        });
      });
    });
  }
};
