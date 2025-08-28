// ==UserScript==
// @name         Spectra Client (Hacked)
// @namespace    http://tampermonkey.net/
// @version      1.8.0
// @description  Clean Spectra Client with a white glow theme, icons, and enhanced UI controls, now with more features.
// @author       You & Jules
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // --- HACK SCRIPT VARIABLES ---
    let version = "0.3.8"
    let alreadyConnected = null;
    let colyRoom = null;
    let sendBytesName = null;
    let injectedBool = false;
    let myId = 1
    let isInitializing = true;
    let clientOptions = null;
    let shideFuxny = {};
    let noaParent = null;
    let noaKeyInParent = null;
    let usingAltInjection = false;
    let playerInventoryParent = null;
    let skyboxEntity = null;
    let skyboxMesh = null;
    let playerEntity = null;

    const r = { //WANG
        keys(e) {
            var t = [],
                o = 0;
            for (var s in e) e != null && (t[o] = s, o++);
            return t
        },
        values(e) {
            for (var t = this.keys(e), o = [], s = 0, i = 0; s < t.length;) {
                var l = t[s],
                    d = e[l];
                o[i] = d, i++, s++
            }
            return o
        },
        assign(e, ...t) {
            let o = Object(e);
            for (let s = 0; s < t.length; s++) {
                let i = t[s];
                if (i != null)
                    for (let l in i) o[l] = i[l]
            }
            return o
        }
    };

    // --- ArmorHUD SCRIPT ---
    const ArmorHUD = {
      name: 'ArmorHUD',
      category: 'Player',
      description: 'Displays your currently equipped armor and selected item.',
      enabled: false,
      observer: null,
      defaultX: "90%",
      defaultY: "50%",
      settings: [
        { id: 'color-mode', name: 'Color Mode', type: 'select', options: ['Theme', 'Custom'], value: 'Theme' },
        { id: 'show-selected', name: 'Show Selected Item', type: 'boolean', value: true },
        { id: 'display-style', name: 'Display Style', type: 'select', options: ['Horizontal', 'Vertical'], value: 'Vertical' },
        { id: 'bg-color', name: 'Background Color', type: 'color', value: 'rgba(30, 33, 41, 0.85)', condition: s => s['color-mode'] === 'Custom' },
        { id: 'padding', name: 'Padding', type: 'slider', value: 4, min: 0, max: 20, step: 1 },
        { id: 'border-radius', name: 'Border Radius', type: 'slider', value: 20, min: 0, max: 20, step: 1 },
        { id: 'border-width', name: 'Border Width', type: 'slider', value: 2, min: 0, max: 5, step: 1 },
        { id: 'border-color', name: 'Border Color', type: 'color', value: 'rgba(255, 255, 255, 0.07)', condition: s => s['color-mode'] === 'Custom' },
        { id: 'item-size', name: 'Item Size', type: 'slider', value: 64, min: 16, max: 64, step: 1 },
        { id: 'item-spacing', name: 'Item Spacing', type: 'slider', value: 0, min: 0, max: 20, step: 1 },
      ],

      element: null,
      lastContentHash: null,
      loopId: null,

      onEnable() {
        this.enabled = true;
        this.createDisplay();
        this.applyStyles();
        this.setupObserver();
        this.updateLoop();
      },

      onDisable() {
        this.enabled = false;
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.destroyDisplay();
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }
      },

      updateLoop() {
        if (!this.enabled) return;
        this.updateDisplay();
        this.loopId = requestAnimationFrame(this.updateLoop.bind(this));
      },

      setupObserver() {
        const setup = () => {
          if (!this.enabled) return;
          const hotbar = document.querySelector('.HotBarGameItemsContainer');
          if (hotbar && !this.observer) {
            this.observer = new MutationObserver((mutations) => {
              const selectionChanged = mutations.some(m =>
                m.type === 'attributes' &&
                m.attributeName === 'class' &&
                m.target.classList.contains('InvenItem')
              );
              if (selectionChanged) this.updateDisplay(true);
            });

            this.observer.observe(hotbar, {
              attributes: true,
              subtree: true,
              attributeFilter: ['class']
            });
            this.updateDisplay(true);
          } else if (!hotbar) {
            setTimeout(setup, 500);
          }
        };
        setup();
      },

      createDisplay() {
        if (this.element) return;
        this.element = document.createElement('div');
        this.element.className = 'armor-hud-display';
        this.element.style.position = "absolute";
        this.element.style.left = this.defaultX;
        this.element.style.top = this.defaultY;
        document.body.appendChild(this.element);
      },

      destroyDisplay() {
        if (this.element) {
          this.element.remove();
          this.element = null;
        }
      },

      extractImage(itemElement) {
        if (!itemElement) return null;
        const twoDImageIcon = itemElement.querySelector('.TwoDImageIcon');
        if (twoDImageIcon && twoDImageIcon.style.backgroundImage && twoDImageIcon.style.backgroundImage !== 'none') {
          return { type: 'image', src: twoDImageIcon.style.backgroundImage.slice(5, -2), filter: null };
        }
        const img = itemElement.querySelector('.TwoDItemGrayscaleVisiblePng');
        const colorHint = itemElement.querySelector('.TwoDItemGrayscale');
        if (img) {
          return { type: 'image', src: img.src, filter: colorHint ? colorHint.style.filter : '' };
        }
        const blockItem = itemElement.querySelector('.BlockItem');
        if (blockItem && blockItem.style.backgroundImage && blockItem.style.backgroundImage !== 'none') {
          return { type: 'image', src: blockItem.style.backgroundImage.slice(5, -2), filter: null };
        }
        const unfilled = itemElement.querySelector('.InvenItemUnfilled');
        if (unfilled) {
          return { type: 'unfilled', src: unfilled.style.backgroundImage.slice(5, -2) };
        }
        return null;
      },

      updateDisplay(forceUpdate = false) {
        if (!this.element) return;
        const armorContainer = document.querySelector('.ArmourItemSlots');
        const armorItems = armorContainer ? Array.from(armorContainer.querySelectorAll('.InvenItem')) : [];
        const armorImages = armorItems.map(item => this.extractImage(item)).filter(Boolean);

        const settings = this.settings.reduce((acc, s) => ({ ...acc, [s.id]: s.value }), {});
        const showSelected = settings['show-selected'];

        const allImages = [...armorImages];
        if (showSelected) {
          const selectedHotbarItemEl = document.querySelector('.HotBarGameItemsContainer .InvenItem.Selected');
          const selectedItemImage = this.extractImage(selectedHotbarItemEl);
          if (selectedItemImage) allImages.push(selectedItemImage);
        }

        const newContentHash = JSON.stringify(allImages);
        if (newContentHash !== this.lastContentHash || forceUpdate) {
          this.element.innerHTML = '';
          allImages.forEach(imgData => {
            const itemContainer = document.createElement('div');
            itemContainer.style.position = 'relative';
            const imgElement = document.createElement('img');
            imgElement.src = imgData.src;
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.imageRendering = 'pixelated';
            itemContainer.appendChild(imgElement);
            this.element.appendChild(itemContainer);
          });
          this.lastContentHash = newContentHash;
          this.applyStyles();
        }
      },

      applyStyles() {
        if (!this.element) return;
        const settings = this.settings.reduce((acc, s) => ({ ...acc, [s.id]: s.value }), {});
        this.element.style.backgroundColor = settings['color-mode'] === 'Theme' ? 'var(--panel)' : settings['bg-color'];
        this.element.style.border = `${settings['border-width']}px solid ${settings['color-mode'] === 'Theme' ? 'var(--border)' : settings['border-color']}`;
        this.element.style.padding = `${settings['padding']}px`;
        this.element.style.borderRadius = `${settings['border-radius']}px`;
        this.element.style.display = 'flex';
        this.element.style.flexDirection = settings['display-style'] === 'Horizontal' ? 'row' : 'column';
        this.element.style.gap = `${settings['item-spacing']}px`;
        this.element.style.userSelect = 'none';
        this.element.style.zIndex = 99999;
        this.element.style.pointerEvents = 'none';
        this.element.querySelectorAll('div').forEach(container => {
          container.style.width = `${settings['item-size']}px`;
          container.style.height = `${settings['item-size']}px`;
        });
      }
    };

    // --- HACK SCRIPT FUNCTIONS ---
    function initializeWiskFeatures() {
        // All of the feature logic from the wisk script will be encapsulated here.
        // This prevents scope pollution and makes it easier to manage.
        console.log("Initializing Wisk features...");

        let blinkState = {
            enabled: false,
            originalSendBytes: null,
            queued: [],
            interval: 0,
            noPacket: false
        };


        let wallJumpInterval = null;
        let wallJumpRunning = false;


        let lockPlayerWaterStateInterval = null;
        let waterJumpingEnabled = false


        let wireFramesBool = false;


        let espEnabled = false;


        let isSkyboxHidden = false;


        let triggerBotEnabled = false;
        let toggleTriggerBotInterval = null;


        const possibleNames = [
            "BodyMesh",
            'Body|Armour',
        ];
        let killAuraEnabled = false
        let killAuraIntervalId = null
        let lastClosestId = null
        let newBox = null;
        let newBoxId = null;
        let __nullKey = null;
        let __stringKey = null;
        let animationFrameId = null;
        let hitBoxEnabled = false;
        const hitboxes = {};


        let cachedNameTagParent = null;
        let cachedBHOPParent = null;


        let autoPotionEnabled = false;
        let autoPotionInterval = null;


        let nameTagsEnabled = false;
        let nameTagsIntervalId = null;
        let nameTagParent = null;


        let bhopEnabled = false;
        let bhopIntervalId = null;


        let  scaffoldEnabled = false;
        let scaffoldIntervalId = null;


        let enemyHealthGuiEnabled = false;
        let healthWatcherInterval = null;
        let lastPercent = null;
        let lastChangeTime = Date.now();
        let resetTimeout = null;


        let eIdKey = null;
        let targetEntity = null;
        let targetEntityDistance = null;


        let pickupReachEnabled = false;
        let originalGetEntitiesInAABB = null;
        const RANGE_MULTIPLIER = 5;
        let ghMethodKey = null;
        let proto = null;


        let bhopKnifeEnabled = false;
        let spaceVid;
        let fadeVolumeInterval;
        let spaceHeld = false;
        let bigHeadsEnabled = false;


        const scannedChunks = new Set();
        let chunkDataField = null;

        let playerKey = null;
        let moveState = null;
        let physState = null;
        let humanoidMeshlist = null;
        let slowHitEnabled = null;


        let everEnabled = {}



        function fadeVolume(from, to, duration) {
          const steps = 30;
          const stepTime = duration / steps;
          let current = 0;

          if (fadeVolumeInterval) clearInterval(fadeVolumeInterval);

          fadeVolumeInterval = setInterval(() => {
            current++;
            const progress = current / steps;
            spaceVid.volume = from + (to - from) * progress;

            if (current >= steps) {
              clearInterval(fadeVolumeInterval);
              fadeVolumeInterval = null;
            }
          }, stepTime * 1000);
        }

        function onKeyDown(e) {
          if (e.code === 'Space' && !spaceHeld) {
            spaceHeld = true;
            spaceVid.style.opacity = '1';
            spaceVid.play();
            fadeVolume(spaceVid.volume, 0.1, 2.5); // fade in to 0.8 over 2 seconds
          }
        }


        function onKeyUp(e) {
          if (e.code === 'Space') {
            spaceHeld = false;
            spaceVid.style.opacity = '0';
            fadeVolume(spaceVid.volume, 0.1, 2.5); //
            setTimeout(() => {
              if (!spaceHeld) spaceVid.pause();
            }, 500);
          }
        }

        function toggleBhopKnife() {
                if (!injectedBool) {

                showTemporaryNotification('You need to inject first habibi!')

            }
          if (!bhopKnifeEnabled) {
            everEnabled.bhopKnifeEnabled = true;
            bhopKnifeEnabled = true;

            spaceVid = document.createElement('video');
            spaceVid.src = 'https://files.catbox.moe/6tm4e7.webm';
            spaceVid.preload = 'auto';
            spaceVid.loop = true;
            spaceVid.muted = false;
            spaceVid.volume = 0;
            spaceVid.playbackRate = 1;
            spaceVid.playsInline = true;

            Object.assign(spaceVid.style, {
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              transform: 'translate(-50%, -50%) scaleX(1.4)',
              zIndex: 21,
              pointerEvents: 'none',
              opacity: '0',
              transition: 'opacity 2.5s ease',
            });

            document.body.appendChild(spaceVid);

            window.addEventListener('keydown', onKeyDown);
            window.addEventListener('keyup', onKeyUp);

          } else {
            bhopKnifeEnabled = false;

            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            if (spaceVid) {
              spaceVid.pause();
              if (spaceVid.parentNode) spaceVid.parentNode.removeChild(spaceVid);
              spaceVid = null;
            }

            spaceHeld = false;
            if (fadeVolumeInterval) clearInterval(fadeVolumeInterval);
          }
        }


        function toggleSlowHit() {
            slowHitEnabled = !slowHitEnabled;
            playerEntity.heldItemState.swingDuration = slowHitEnabled ? 1500 : 200;
        }


        function matchesAllPatterns(fn) {
            const patterns = ["this.names.position", ".base[0]"].map(p => p.replace(/\s+/g, ''));
            try {
                const src = fn.toString().replace(/\s+/g, '');
                return patterns.every(p => src.includes(p));
            } catch {
                return false;
            }
        }

        function findClassConstructor(obj) {
            let current = obj;
            while (current) {
                for (const key of Reflect.ownKeys(current)) {
                    let val;
                    try {
                        const desc = Object.getOwnPropertyDescriptor(current, key);
                        val = desc?.value ?? current[key];
                    } catch {
                        continue;
                    }
                    if (typeof val === "function" && matchesAllPatterns(val)) {
                        return val;
                    }
                }
                current = Object.getPrototypeOf(current);
            }
            return null;
        }

        function findGhMethod(clsConstructor) {
            const protoLocal = clsConstructor?.prototype;
            if (!protoLocal) return null;

            for (const key of Reflect.ownKeys(protoLocal)) {
                if (key === "constructor") continue;
                const fn = protoLocal[key];
                if (typeof fn === "function" && matchesAllPatterns(fn)) {
                    return {
                        fn,
                        key
                    };
                }
            }
            return null;
        }



        function toggleScaffold() {
            scaffoldEnabled = !scaffoldEnabled;
            everEnabled.scaffoldEnabled = true;
            if (scaffoldEnabled) {
                scaffoldIntervalId = setInterval(() => {
                    const pos = shideFuxny.entities.getState(1, 'position').position;
                    if (!pos || playerEntity.heldItemState.heldType !== "CubeBlock") return;


                    const exactX = pos[0];
                    const exactZ = pos[2];

                    const blockX = Math.floor(exactX);
                    const blockY = Math.floor(pos[1]);
                    const blockZ = Math.floor(exactZ);

                    const checkPlace = (x, y, z) => {
                        return (
                            playerEntity.checkTargetedBlockCanBePlacedOver([x, y, z]) ||
                            r.values(shideFuxny.world)[47].call(shideFuxny.world, x, y, z) === 0
                        );
                    };

                    if (checkPlace(blockX, blockY - 1, blockZ)) {
                        wangPlace([blockX, blockY - 1, blockZ]);
                        return;
                    }

                    const dx = exactX - blockX;
                    const dz = exactZ - blockZ;

                    const offsets = [];

                    if (dx < 0.3) offsets.push([-1, 0]);
                    if (dx > 0.7) offsets.push([1, 0]);
                    if (dz < 0.3) offsets.push([0, -1]);
                    if (dz > 0.7) offsets.push([0, 1]);

                    for (const [ox, oz] of offsets) {
                        const nx = blockX + ox;
                        const nz = blockZ + oz;
                        if (checkPlace(nx, blockY - 1, nz)) {
                            wangPlace([nx, blockY - 1, nz]);
                            return;
                        }
                    }

                }, 50);
            } else {
                clearInterval(scaffoldIntervalId);
                scaffoldIntervalId = null;
            }
        }



        function togglePickupReach() {
            if (!injectedBool) {
                return;
            }
            if (!proto || !originalGetEntitiesInAABB) {
                const cls = findClassConstructor(shideFuxny.NIGHT.entities);
                if (!cls) {
                    return;
                }

                const ghMethod = findGhMethod(cls);
                if (!ghMethod) {
                    return;
                }

                proto = cls.prototype;
                originalGetEntitiesInAABB = ghMethod.fn;
                ghMethodKey = ghMethod.key;
            }

            if (pickupReachEnabled) {
                proto[ghMethodKey] = originalGetEntitiesInAABB;
                pickupReachEnabled = false;
            } else {
                everEnabled.pickupReachEnabled = true;
                proto[ghMethodKey] = function(box, name) {
                    const center = [
                        (box.base[0] + box.max[0]) / 2,
                        (box.base[1] + box.max[1]) / 2,
                        (box.base[2] + box.max[2]) / 2,
                    ];
                    const halfSize = [
                        (box.max[0] - box.base[0]) / 2,
                        (box.max[1] - box.base[1]) / 2,
                        (box.max[2] - box.base[2]) / 2,
                    ];

                    const enlarged = {
                        base: center.map((c, i) => c - halfSize[i] * RANGE_MULTIPLIER),
                        max: center.map((c, i) => c + halfSize[i] * RANGE_MULTIPLIER)
                    };

                    return originalGetEntitiesInAABB.call(this, enlarged, name);
                };
                pickupReachEnabled = true;
            }
        }

        function passiveFeatures() {
            everEnabled.passiveFeaturesEnabled = true;
            Object.defineProperty(shideFuxny.entities[shideFuxny.impKey].moveState.list[0].speedMultiplier.multipliers, "inCobweb", {
                configurable: true,
                enumerable: true,
                get() {
                    return 1;
                },
                set(value) {
                }
            });

            shideFuxny.entityList[1][1].ranks[0] = "developer";
            shideFuxny.entityList[1][1].ranks[1] = "youtuber";
            shideFuxny.entityList[1][1].ranks[2] = "super";
        }



        function emitSafePrimaryFire() {
        const fakeEvent = {
          timeStamp: performance.now(),
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
          metaKey: false,
          button: 0,
          buttons: 1,
          clientX: innerWidth / 2 + Math.floor(Math.random() * 4 - 2),
          clientY: innerHeight / 2 + Math.floor(Math.random() * 4 - 2),
          screenX: screen.width / 2,
          screenY: screen.height / 2
        };

            shideFuxny.NIGHT.inputs.down.emit("primary-fire", fakeEvent);
        }



        function inMenu() {
            const requests = shideFuxny.Props.pointerLockWrapper.pointerUnlockRequests;
            return requests.includes("SettingsMenuComponent") || requests.includes("InGameMenu");
        }


        function movePotionToSlot() {
            if (!playerInventoryParent || !playerInventoryParent.playerInventory?.items) {
                return false;
            }
            const items = playerInventoryParent.playerInventory.items;
            let potionSlot = null;
            for (let i = 1; i < items.length; i++) {
                const item = items[i];
                if (!item || typeof item.name !== 'string') continue;
                const name = item.name.toLowerCase();
                if (
                    name.includes("potion") &&
                    name.includes("splash") &&
                    (name.includes("healing") || name.includes("shield"))
                ) {


                    potionSlot = i;
                    break;
                }
            }
            if (potionSlot === null) {
                return false;
            }
            playerInventoryParent.swapPosClient(potionSlot, 1, null);
            return true;
        }




        function makeHitboxes() {
            if (!injectedBool) {
                return;
            }

            const rendering = r.values(shideFuxny.rendering)[18];
            const objectData = rendering?.objectData;
            if (!objectData || !eIdKey) return;

            const activeEIds = new Set();

            for (const key in objectData) {
                if (key === "1") continue;
                const obj = objectData[key];
                const eId = obj[eIdKey];

                if (
                    eId == null ||
                    eId === myId ||
                    obj.pickable === false ||
                    obj.type !== "Player" ||
                    !shideFuxny.entities.getState(eId, "genericLifeformState")
                ) continue;

                activeEIds.add(eId);

                if (hitboxes[eId]) continue;

                let newBox_00 = shideFuxny.Lion.Mesh.CreateBox("mesh", 1, false, 1, shideFuxny.Lion.scene);
                newBox_00.renderingGroupId = 2;

                newBox_00.material = new shideFuxny.Lion.StandardMaterial("mat", shideFuxny.Lion.scene);
                newBox_00.material.diffuseColor = new shideFuxny.Lion.Color3(1, 1, 1);
                newBox_00.material.emissiveColor = new shideFuxny.Lion.Color3(1, 1, 1);
                newBox_00.name = '_';
                newBox_00.id = '__' + eId;

                let defaultPosition = new newBox_00.position.constructor(0, 0.32, 0);
                newBox_00.position = defaultPosition.clone();
                newBox_00._scaling._y = 2.2;
                newBox_00.material.alpha = 0.5;
                newBox_00.isVisible = hitBoxEnabled;

                rendering.attachTransformNode(newBox_00, key, 13);
                r.values(shideFuxny.rendering)[27].call(shideFuxny.rendering, newBox_00);

                Object.defineProperty(newBox_00._nodeDataStorage, '_isEnabled', {
                    get: () => true,
                    set: (v) => {},
                    configurable: false
                });

                hitboxes[eId] = newBox_00;
            }

            for (const eId in hitboxes) {
                if (!activeEIds.has(eId)) {
                    hitboxes[eId]?.dispose();
                    delete hitboxes[eId];
                }
            }

            for (const key in objectData) {
                const obj = objectData[key];
                const eId = obj?.[eIdKey];
                if (!eId || !hitboxes[eId]) continue;

                const baseNode = obj.nodes?.[0];
                if (!baseNode) continue;

                hitboxes[eId].isVisible = baseNode.enabled && hitBoxEnabled;
            }
        }



        (() => {
            const old = document.getElementById("vertical-health-bar");
            if (old) old.remove();

            const container = document.createElement("div");
            container.id = "vertical-health-bar";
            Object.assign(container.style, {
                position: "fixed",
                left: "calc(50% - 200px)",
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "200px",
                background: "#000",
                border: "2px solid black",
                zIndex: 120,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-end",
                overflow: "hidden"
            });

            const fill = document.createElement("div");
            Object.assign(fill.style, {
                width: "100%",
                height: "100%",
                background: "limegreen",
                transform: "scaleY(1)",
                transformOrigin: "bottom",
                transition: "transform 0.2s ease, background 0.2s ease",
            });

            container.appendChild(fill);
            document.body.appendChild(container);

            function getHealthColor(health) {
                const ratio = health / 100;

                if (ratio > 0.5) {
                    const t = (ratio - 0.5) * 2;
                    const r = Math.round(255 * (1 - t));
                    const g = 255;
                    return `rgb(${r}, ${g}, 0)`;
                } else {
                    const t = ratio * 2;
                    const r = 255;
                    const g = Math.round(255 * t);
                    return `rgb(${r}, ${g}, 0)`;
                }
            }

            window.setHealthBar = function(health, show = true) {
                const clamped = Math.max(0, Math.min(health, 100));
                fill.style.transform = `scaleY(${clamped / 100})`;
                fill.style.background = getHealthColor(clamped);
                container.style.display = show ? "flex" : "none";
            };
        })();

        setHealthBar(100, false)

        function toggleEnemyHealthGui() {
            if (!injectedBool) {
                return;
            }
            enemyHealthGuiEnabled = !enemyHealthGuiEnabled;

            if (enemyHealthGuiEnabled) {
                startHealthWatcher();
            } else {
                if (healthWatcherInterval) clearInterval(healthWatcherInterval);
                if (resetTimeout) clearTimeout(resetTimeout);
                setHealthBar(100, false);
                lastPercent = null;
            }
        }

        function startHealthWatcher() {
            everEnabled.enemyHealthGuiEnabled = true;
            if (healthWatcherInterval) clearInterval(healthWatcherInterval);

            healthWatcherInterval = setInterval(() => {
                const list = shideFuxny.entities[shideFuxny.impKey].entityName.list;
                let percent = null;
                let foundTarget = false;


                for (let i = 0; i < list.length; i++) {
                    const targetEntity = list[i];
                    if (r.values(targetEntity)[0] === lastClosestId) {
                        percent = r.values(targetEntity)[7];
                        foundTarget = true;
                        break;
                    }
                }

                if (!foundTarget || percent === 0 || percent >= 1) {
                    if (resetTimeout) {
                        clearTimeout(resetTimeout)
                    };
                    setHealthBar(100, false);
                    lastPercent = null;
                    return;
                }

                if (percent !== null) {
                    lastPercent = percent;
                    lastChangeTime = Date.now();
                    setHealthBar(percent * 100, true);

                    if (resetTimeout) clearTimeout(resetTimeout);
                    resetTimeout = setTimeout(() => {
                        setHealthBar(100, false);
                        lastPercent = null;
                    }, 10000);
                }
            }, 300);
        }

        function checkAndClick() {
            const hit = playerEntity.tryHitEntity();

            if (hit?.hitEId != null) {
                if (
                    shideFuxny.entities.getState(1, "genericLifeformState").isAlive &&
                    shideFuxny.entities.getState(hit.hitEId, "genericLifeformState") &&
                    shideFuxny.entities.getState(hit.hitEId, "genericLifeformState").isAlive &&
                    r.values(shideFuxny.entityList)?.[1]?.[hit.hitEId].canAttack
                ) {
                    emitSafePrimaryFire();
                    lastClosestId = hit.hitEId
                }
            }
        }




        function toggleTriggerBot() {
            if (!injectedBool) {
                return;
            }
            everEnabled.triggerBotEnabled = true;
            if (triggerBotEnabled) {
                clearTimeout(toggleTriggerBotInterval);
                triggerBotEnabled = false;
            } else {
                triggerBotEnabled = true;

                function autoAttackLoop() {
                    if (!triggerBotEnabled) return;
                    checkAndClick();
                    const nextDelay = 200 + (Math.random() * 40 - 20);
                    toggleTriggerBotInterval = setTimeout(autoAttackLoop, nextDelay);
                }
                autoAttackLoop();
            }
        }


        function toggleLockPlayerWaterState() {
            if (!injectedBool) {
                return;
            }
            everEnabled.waterJumpingEnabled = true;
            const movementList = shideFuxny.entities[shideFuxny.impKey]?.movement?.list;
            if (!Array.isArray(movementList) || movementList.length === 0) return;

            const c = movementList[0];

            if (waterJumpingEnabled) {
                waterJumpingEnabled = false;
                return;
            }

            try {
                Object.defineProperty(c, "inAirFromWater", {
                    get: () => false,
                    set: () => {},
                    configurable: true
                });

                Object.defineProperty(c, "_jumpCount", {
                    get: () => 0,
                    set: () => {},
                    configurable: true
                });

                Object.defineProperty(c, "_ticksOutOfWater", {
                    get: () => 346,
                    set: () => {},
                    configurable: true
                });

                Object.defineProperty(c, "isOnIce", {
                    get: () => true,
                    set: () => {},
                    configurable: true
                });

                waterJumpingEnabled = true;
            } catch (e) {
                console.error("Error locking player water state:", e);
            }
        }


        let bigHeadsInterval = null;

        function toggleBigHeads() {
            if (!injectedBool) {
                return;
            }
            everEnabled.bigHeadsEnabled = true;
            const objectData = r.values(shideFuxny.rendering)[18].objectData;

            if (!bigHeadsEnabled) {
                for (let key in objectData) {
                    let obj = objectData[key];

                    if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                        let node = obj.nodes[16];

                        node.scale._x = 6;
                        node.scale._y = 6;
                        node.scale._z = 6;

                        node.position._y = -1;
                    }
                }

                bigHeadsInterval = setInterval(() => {
                    for (let key in objectData) {
                        let obj = objectData[key];

                        if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                            let node = obj.nodes[16];

                            if (node.scale._x === 1 && node.scale._y === 1 && node.scale._z === 1) {
                                node.scale._x = 6;
                                node.scale._y = 6;
                                node.scale._z = 6;

                                node.position._y = -1;
                            }
                        }
                    }
                }, 10000);
            } else {
                for (let key in objectData) {
                    let obj = objectData[key];

                    if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                        let node = obj.nodes[16];

                        node.scale._x = 1;
                        node.scale._y = 1;
                        node.scale._z = 1;

                        node.position._y = 0.7199999690055847;
                    }
                }

                clearInterval(bigHeadsInterval);
                bigHeadsInterval = null;
            }

            bigHeadsEnabled = !bigHeadsEnabled;
        }


        function toggleWallJumpScript() {
            if (!injectedBool) {
                return;
            }
            everEnabled.wallJumpRunning = true;
            const client = shideFuxny?.clientOptions;
            const body = shideFuxny?.physics?.bodies?.[0];

            if (!client || !body) return;

            if (wallJumpRunning) {
                Object.defineProperty(client, "airJumpCount", {
                    value: 0,
                    writable: true,
                    configurable: true
                });

                wallJumpRunning = false;
                return;
            }

            Object.defineProperty(client, "airJumpCount", {
                get() {
                    if (!body.resting) return 0;
                    const [rx, , rz] = body.resting;
                    return (rx === 1 || rx === -1 || rz === 1 || rz === -1) ? 999 : 0;
                },
                set(_) {},
                configurable: true
            });

            wallJumpRunning = true;
        }




        function wangPlace(position) {

            let heldBlock = r.values(shideFuxny.NIGHT.entities[shideFuxny.impKey])[22].list[0]._blockItem;
            let worldInstanceKey = Object.keys(heldBlock)[0];
            let worldInstance = Object.values(heldBlock)[0];
            let targetedBlockKey = Object.keys(worldInstance)[25];
            let targetedBlock = worldInstance[targetedBlockKey];

            function spoofTargetedBlock(position) {
                return new Proxy({}, {
                    get(target, prop, receiver) {
                        if (prop === worldInstanceKey) {
                            return new Proxy(worldInstance, {
                                get(inner, key) {
                                    if (key === targetedBlockKey) {
                                        let spoofedTargetedBlock = structuredClone(targetedBlock) || {};
                                        spoofedTargetedBlock.position = position;
                                        return spoofedTargetedBlock;
                                    }
                                    return worldInstance[key];
                                },
                            });
                        }

                        if (prop == "checkTargetedBlockCanBePlacedOver") {
                            return () => true;
                        }

                        if (typeof heldBlock[prop] == "function") {
                            return heldBlock[prop].bind(heldBlock);
                        } else {
                            return heldBlock[prop];
                        }
                    },
                });
            }

            heldBlock.placeBlock.call(spoofTargetedBlock(position));
        }

        function placeToPlayer(position) {

            const blockX = Math.floor(position[0]);
            const blockY = Math.floor(position[1]);
            const blockZ = Math.floor(position[2]);
            if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 3, blockZ]) || r.values(shideFuxny.world)[47].call(shideFuxny.world, blockX, blockY - 3, blockZ) === 0) {
                wangPlace([blockX, blockY - 3, blockZ])
            }
            if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 2, blockZ]) || r.values(shideFuxny.world)[47].call(shideFuxny.world, blockX, blockY - 2, blockZ) === 0) {
                wangPlace([blockX, blockY - 2, blockZ])
            }
            if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 1, blockZ]) || r.values(shideFuxny.world)[47].call(shideFuxny.world, blockX, blockY - 1, blockZ) === 0) {
                wangPlace([blockX, blockY - 1, blockZ])
            }
            if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY, blockZ]) || r.values(shideFuxny.world)[47].call(shideFuxny.world, blockX, blockY, blockZ) === 0) {
                wangPlace([blockX, blockY, blockZ])
            }

        }

        function placeSpike(position) {

            const blockX = Math.floor(position[0]);
            const blockY = Math.floor(position[1]);
            const blockZ = Math.floor(position[2]);
            if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY + 1, blockZ]) || r.values(shideFuxny.world)[47].call(shideFuxny.world, blockX, blockY + 1, blockZ) === 0) {
                wangPlace([blockX, blockY + 1, blockZ])
            }
        }

        function moveItem(itemName, desiredSlot) {
            if (!playerInventoryParent || !playerInventoryParent.playerInventory?.items) {
                return false;
            }
            const items = playerInventoryParent.playerInventory.items;
            let oldSlot = null;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (!item || typeof item.name !== 'string') continue;
                const name = item.name.toLowerCase();
                if (name.includes(itemName)) {


                    oldSlot = i;
                    break;
                }
            }
            if (oldSlot === null) {
                return false;
            }
            playerInventoryParent.swapPosClient(oldSlot, desiredSlot, null);
            return true;
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function autoSW() {
            if (lastClosestId && targetEntityDistance <= 36) {

                if (moveItem("net", 9) || moveItem("web", 9)) {
                    let enemyPos = shideFuxny.entities.getState(lastClosestId, 'position').position;

                    shideFuxny.NIGHT.inputs.down['_events'][`HotBarSlot${10}`]();

                    placeToPlayer(enemyPos);

                    await sleep(50);

                    if (moveItem("spikes", 8)) {
                        shideFuxny.NIGHT.inputs.down['_events'][`HotBarSlot${9}`]();
                        placeSpike(enemyPos);
                    }
                } else {
                    if (moveItem("spikes", 8)) {
                        shideFuxny.NIGHT.inputs.down['_events'][`HotBarSlot${9}`]();
                        await sleep(50);

                        let enemyPos = shideFuxny.entities.getState(lastClosestId, 'position').position;
                        placeToPlayer(enemyPos);
                    }
                }
                shideFuxny.NIGHT.inputs.down['_events'].HotBarSlot1();
            }
            if (!everEnabled.autoSWUsed) {everEnabled.autoSWUsed = true};
        }


        function startTargetFinder() {
            let armourNodeNum = r.values(shideFuxny.rendering)[18].getNamedNode(1, "Body|Armour")
            let closestObj = null;
            let targetFinderId = setInterval(() => {
                if (!injectedBool) {
                    return;
                }

                if (!shideFuxny.entities.getState(1, "genericLifeformState").isAlive) return;

                const myPos = shideFuxny.entities.getState?.(myId, 'position')?.position;
                if (!myPos) return;

                const rendering = r.values(shideFuxny.rendering)[18];
                const objectData = rendering?.objectData;
                if (!objectData) return;

                if (!eIdKey) return;

                let closestId = null;
                let minDist = 100;


                for (const key in objectData) {
                    const obj = objectData[key];
                    const eId = obj[eIdKey];

                    if (
                        eId == null ||
                        obj.type !== "Player" ||
                        obj.pickable === false ||
                        eId === myId ||
                        !shideFuxny.entities.getState(eId, "genericLifeformState") ||
                        !shideFuxny.entities.getState(eId, "genericLifeformState").isAlive
                    ) continue;


                    if (!eId || eId === myId || obj.pickable === false || obj.type !== "Player") continue;

                    const state = shideFuxny.entities.getState(eId, "genericLifeformState");
                    if (!state || !state.isAlive) continue;

                    const ent = r.values(shideFuxny.entityList)?.[1]?.[eId];
                    if (!ent || ent.canAttack !== true) continue;

                    const pos = shideFuxny.entities.getState(eId, 'position')?.position;
                    if (!pos) continue;

                    const dx = pos[0] - myPos[0];
                    const dy = pos[1] - myPos[1];
                    const dz = pos[2] - myPos[2];

                    const dist = dx * dx + dy * dy + dz * dz;
                    if (dist < minDist) {
                        minDist = dist;
                        closestId = eId;
                        closestObj = obj;
                    }

                }


                const armourNode = closestObj?.nodes?.[armourNodeNum];
                if (armourNode?.actuallyEnabled) {
                    newBox.name = possibleNames[1];
                    newBox.id = possibleNames[1];
                } else {
                    newBox.name = possibleNames[0];
                    newBox.id = possibleNames[0];
                }


                if (closestId != null) {
                    newBox.metadata.eId = closestId;
                    if (closestId !== lastClosestId) {
                        if (hitboxes[closestId]) {
                            hitboxes[closestId].material.diffuseColor = new shideFuxny.Lion.Color3(1, 0, 0);
                            hitboxes[closestId].material.emissiveColor = new shideFuxny.Lion.Color3(1, 0, 0);
                            for (const id in hitboxes) {
                                if (id !== closestId && hitboxes[id]) {
                                    hitboxes[id].material.diffuseColor = new shideFuxny.Lion.Color3(1, 1, 1);
                                    hitboxes[id].material.emissiveColor = new shideFuxny.Lion.Color3(1, 1, 1);
                                }
                            }
                        }

                        lastClosestId = closestId;
                    }
                } else {
                    lastClosestId = null;
                }

                if (killAuraEnabled && closestId != null && minDist < 64) {
                    newBox[__nullKey] = true;
                    targetEntityDistance = Math.floor(Math.sqrt(minDist));
                } else {
                    newBox[__nullKey] = false;
                    targetEntityDistance = null;
                }


            }, 100);
        }

        function toggleKillAura() {
            if (!injectedBool) {
                return;
            }
            everEnabled.killAuraEnabled = true;
            if (killAuraEnabled) {
            } else {
                newBox[__nullKey] = false;

            }
            killAuraEnabled = !killAuraEnabled;
        }



        function toggleHitBoxes() {
            if (!injectedBool) {
                return;
            }
            everEnabled.hitBoxEnabled = true;
            hitBoxEnabled = !hitBoxEnabled;

            for (const eId in hitboxes) {
                const box = hitboxes[eId];
                if (box && box.isVisible !== hitBoxEnabled) {
                    box.isVisible = hitBoxEnabled;
                }
            }
        }


        function toggleSkybox() {
            if (!injectedBool) {
                return;
            }
            everEnabled.skyBoxEnabled = true;
            (function saveSkyboxEntity() {
                for (let i = 0; i < 10000; i++) {
                    const meshState = shideFuxny.entities.getState(i, "mesh");
                    if (meshState?.mesh?.id === "skyBox") {
                        skyboxEntity = i;
                        skyboxMesh = meshState.mesh;
                        break;
                    }
                }
            })();

            if (!skyboxMesh) {
                return;
            }

            isSkyboxHidden = !isSkyboxHidden;
            skyboxMesh.isVisible = isSkyboxHidden ? false : true;
        }

        function toggleWireframe() {
            if (!injectedBool) {
                return;
            }
            everEnabled.wireFramesBool = true;
            wireFramesBool = !wireFramesBool;

            const renderings = r.values(shideFuxny.rendering);
            for (const rendering of renderings) {
                const thinMeshes = r.values(shideFuxny.rendering)[18].thinMeshes;
                if (!Array.isArray(thinMeshes)) continue;

                for (const thinMesh of thinMeshes) {
                    const mesh = thinMesh?.mesh;
                    const material = mesh?.material;
                    const name = mesh?.name;

                    if (
                        material &&
                        typeof material.wireframe === "boolean" &&
                        !(typeof name === "string" && name.includes("Armour"))
                    ) {
                        material.wireframe = wireFramesBool;
                    }
                }
            }
        }


        let chestESPEnabled = false;
        let oreESPEnabled = false;
        let chestOreInterval = null;
        let chestBoxes = {};


        function clearESPBoxes() {
            for (const key in chestBoxes) {
                for (const {
                        mesh,
                        id
                    }
                    of chestBoxes[key]) {
                    mesh.dispose();
                    shideFuxny.entities.deleteEntity(id);
                }
            }
            scannedChunks.clear();
            chestBoxes = {};
        }


        function reverseIndex(i, stride) {
            const x = Math.floor(i / stride[0]);
            const remX = i % stride[0];
            const y = Math.floor(remX / stride[1]);
            const z = remX % stride[1];
            return [x, y, z];
        }

        function getChunkKey(chunk) {
            const [wx, wy, wz] = chunk.pos || [0, 0, 0];
            const cx = Math.floor(wx / 32);
            const cy = Math.floor(wy / 32);
            const cz = Math.floor(wz / 32);
            return `${cx}|${cy}|${cz}|overworld`;
        }

        function scanChunk(chunk, blockIDs) {
            const blockData = chunk[chunkDataField];
            if (!blockData) return;

            const {
                data,
                stride
            } = blockData;

            const pos = chunk.pos || [0, 0, 0];
            if (!data || !stride) return;

            const chunkKey = getChunkKey(chunk);
            for (let i = 0; i < data.length; i++) {
                const blockID = data[i];
                if (!blockIDs.includes(blockID)) continue;

                const [x, y, z] = reverseIndex(i, stride);
                const worldX = pos[0] + x + 0.5;
                const worldY = pos[1] + y + 0.5;
                const worldZ = pos[2] + z + 0.5;

                const mesh = shideFuxny.Lion.Mesh.CreateBox("espbox", 0.5, false, 1, shideFuxny.Lion.scene);
                mesh.position.set(worldX, worldY, worldZ);
                mesh.renderingGroupId = 1;

                mesh.material = new shideFuxny.Lion.StandardMaterial("mat", shideFuxny.Lion.scene)

                const id = shideFuxny.entities.add([worldX, worldY, worldZ], null, null, mesh);
                if (!chestBoxes[chunkKey]) chestBoxes[chunkKey] = [];
                chestBoxes[chunkKey].push({
                    mesh,
                    id
                });


                if ([204, 205, 206, 207].includes(blockID)) {
                    mesh.material.diffuseColor = new shideFuxny.Lion.Color3(1, 0.5, 0);
                    mesh.material.emissiveColor = new shideFuxny.Lion.Color3(1, 0.5, 0);
                }
                if (blockID === 45) {
                    mesh.material.diffuseColor = new shideFuxny.Lion.Color3(0, 0, 1);
                    mesh.material.emissiveColor = new shideFuxny.Lion.Color3(0, 0, 1);
                }

                if (blockID === 465) {
                    mesh.material.diffuseColor = new shideFuxny.Lion.Color3(0.7, 0.5, 1);
                    mesh.material.emissiveColor = new shideFuxny.Lion.Color3(0.7, 0.5, 1);
                }
            }
        }

        function scanAllChunks() {
            if (!shideFuxny?.world || !shideFuxny?.world?.[shideFuxny.impKey]?.hash) return;
            const chunkHash = shideFuxny.world[shideFuxny.impKey].hash;
            for (const scannedKey of scannedChunks) {
                if (!(scannedKey in chestBoxes)) continue;

                if (!Object.values(chunkHash).some(chunk => getChunkKey(chunk) === scannedKey)) {
                    for (const {
                            mesh,
                            id
                        }
                        of chestBoxes[scannedKey]) {
                        mesh.dispose();
                        shideFuxny.entities.deleteEntity(id);
                    }
                    delete chestBoxes[scannedKey];
                    scannedChunks.delete(scannedKey);
                }
            }

            for (const chunkKey in chunkHash) {

                const chunk = chunkHash[chunkKey];
                if (!chunkDataField) {
                    autoDetectChunkDataField(chunk);
                    if (!chunkDataField) continue;
                }

                const blockData = chunk[chunkDataField];
                if (!blockData?.data || !blockData.stride || !chunk.pos) continue;


                const key = getChunkKey(chunk);
                if (scannedChunks.has(key)) continue;
                scannedChunks.add(key);
                if (chestESPEnabled) scanChunk(chunk, [204, 205, 206, 207]);
                if (oreESPEnabled) scanChunk(chunk, [44, 45, 465, 50]);
            }
        }


        function toggleChestESP() {
            if (!injectedBool) {
                return;
            }
            everEnabled.chestESPEnabled = true;
            chestESPEnabled = !chestESPEnabled;
            if (chestESPEnabled || oreESPEnabled) {
                scanAllChunks();
                chestOreInterval = setInterval(scanAllChunks, 5000);
            } else {
                clearInterval(chestOreInterval);
                chestOreInterval = null;
                clearESPBoxes();
                scannedChunks.clear();
            }
        }

        function toggleOreESP() {
            if (!injectedBool) {
                return;
            }
            everEnabled.oreESPEnabled = true;
            oreESPEnabled = !oreESPEnabled;
            if (chestESPEnabled || oreESPEnabled) {
                scanAllChunks();
                chestOreInterval = setInterval(scanAllChunks, 5000);
            } else {
                clearInterval(chestOreInterval);
                chestOreInterval = null;
                clearESPBoxes();
                scannedChunks.clear();
            }
        }



        function toggleESP() {
            if (!injectedBool) {
                return;
            }
            everEnabled.espEnabled = true;
            if (!shideFuxny.impKey) return;
            espEnabled = !espEnabled;
            const groupId = espEnabled ? 2 : 0;

            if (Array.isArray(r.values(shideFuxny.rendering)[18].thinMeshes)) {
                for (const thinMesh of r.values(shideFuxny.rendering)[18].thinMeshes) {
                    if (thinMesh?.mesh && typeof thinMesh.mesh.renderingGroupId === "number") {
                        thinMesh.mesh.renderingGroupId = groupId;
                    }
                }
            }
        }

        function findNoaAndKey() {
                let winDescriptors = Object.getOwnPropertyDescriptors(window);
                let wpName = Object.keys(winDescriptors).find(key => winDescriptors[key]?.set?.toString().includes("++"));
                let wpInstance = null;

                if (wpName) {wpInstance = window[wpName] = window[wpName]}

            if (wpInstance) {
                wpInstance.push([
                    [Math.floor(Math.random() * 90000) + 10000], {},
                    function(wpRequire) {
                        shideFuxny.findModule = (code) => wpRequire(Object.keys(wpRequire.m)[Object.values(wpRequire.m).findIndex(m => m.toString().includes(code))]);
                        shideFuxny.Props = Object.values(shideFuxny.findModule("nonBlocksClient:")).find(prop => typeof prop == "object");
                        shideFuxny.NIGHT = Object.values(shideFuxny.Props).find(prop => prop?.entities);
                    }
                ]);
            }

            if (!shideFuxny.NIGHT) {
                usingAltInjection = true;

                    function findObjectsWithEntitiesAndCamera(obj) {
                      const matches = [];
                      const visited = new WeakSet();

                      function recurse(current, path = []) {
                        if (typeof current !== 'object' || current === null) return;
                        if (visited.has(current)) return;
                        visited.add(current);

                        const keys = Object.keys(current);
                        if (keys.includes('entities') && keys.includes('camera')) {
                          matches.push({
                            path: path.join('.'),
                            object: current
                          });
                        }

                        for (const key of keys) {
                          const value = current[key];
                          if (typeof value === 'object' && value !== null) {
                            recurse(value, [...path, key]);
                          }
                        }
                      }

                      recurse(obj);
                      return matches;
                    }


                    const result = findObjectsWithEntitiesAndCamera(window);
                    shideFuxny.NIGHT = result[0].object


            };


            const targetValue = r.values(shideFuxny.NIGHT.entities)[2];
            const entityEntries = Object.entries(shideFuxny.NIGHT.entities);
            shideFuxny.impKey = entityEntries.find(([_, val]) => val === targetValue)?.[0];
            shideFuxny.registry = r.values(shideFuxny.NIGHT)[17]
            shideFuxny.rendering = r.values(shideFuxny.NIGHT)[12]
            shideFuxny.entities = shideFuxny.NIGHT.entities;



            if (shideFuxny.impKey) {

                const key = shideFuxny.impKey;
                if (key) {
                    const entity = shideFuxny.NIGHT.entities?.[key];
                    if (entity?.moveState?.list?.[0] && entity?.movement?.list?.[0]) {
                        playerKey = key;
                        moveState = entity.moveState.list[0];
                        physState = entity.movement.list[0];
                        cachedBHOPParent = entity;
                    }
                }
            }

            (function findECS() {
                const noaObj = shideFuxny.NIGHT;
                if (!noaObj) {
                    return;
                }

                for (const [key, val] of Object.entries(noaObj)) {
                    if (key === "entities") continue;

                    if (typeof val === "object" && typeof val.getState === "function") {
                        shideFuxny.ECS = val;
                        break;
                    }
                }

            })();

            function findeIdKey() {

                const rendering = r.values(shideFuxny.rendering)[18];
                const objectData = rendering?.objectData;
                if (!objectData) return;

                const sample = objectData[1];
                for (const key in sample) {
                    if (sample[key] === 1) {
                        eIdKey = key;
                        break;
                    }
                }
            }

            findeIdKey();

            function findAddComponentFunction(obj) {
                const exclude = ['overwriteComponent', 'deleteComponent', 'removeComponent', 'getState'];
                for (const key in obj) {
                    if (exclude.includes(key)) continue;
                    const fn = obj[key];
                    if (typeof fn !== 'function') continue;
                    try {
                        fn(999999, "__FAKE_COMPONENT__", {});
                    } catch (err) {
                        const msg = (err?.message || "").toLowerCase();
                        if (
                            msg.includes("unknown component") ||
                            msg.includes("already has component") ||
                            (msg.includes("component") && msg.includes("missing"))
                        ) {
                            return key;
                        }
                    }
                }
                return null;
            }



            let mesh = r.values(shideFuxny.rendering)[7].meshes[0];
            let scene = r.values(shideFuxny.rendering)[7];
            let engine = scene.getEngine();
            let StandardMaterial = mesh.material.constructor;
            let Color3 = mesh.material.diffuseColor.constructor;
            const addKey = findAddComponentFunction(shideFuxny.NIGHT.entities);
            const addComponent = shideFuxny.NIGHT.entities[addKey];
            shideFuxny.world = r.values(shideFuxny.NIGHT)[11]
            shideFuxny.physics = shideFuxny.NIGHT.physics
            shideFuxny.camera = shideFuxny.NIGHT.camera
            shideFuxny.bloxd = shideFuxny.NIGHT.bloxd
            shideFuxny.clientOptions = r.values(shideFuxny.NIGHT)[29]
            shideFuxny.Lion = {
                scene,
                engine,
                InstancedMesh: mesh.constructor,
                Mesh: mesh.constructor,
                Scene: scene.constructor,
                Engine: engine.constructor,
                Color3,
                StandardMaterial,
                addComponent,
                addKey
            };
            playerInventoryParent = shideFuxny.entities[shideFuxny.impKey].inventory.list[0].opWrapper


            function autoDetectChunkDataField(chunk) {
                for (const key of Object.keys(chunk)) {
                    const val = chunk[key];
                    if (!val) continue;

                    if (
                        typeof val === "object" &&
                        Array.isArray(val.stride) &&
                        val.stride.length === 3 &&
                        (
                            Array.isArray(val.data) ||
                            ArrayBuffer.isView(val.data)
                        )
                    ) {
                        chunkDataField = key;
                        return key;
                    }
                }

                return null;
            }

            autoDetectChunkDataField(Object.values(shideFuxny.world[shideFuxny.impKey].hash)[0]);

            const maybeEntity = r.values(r.values(shideFuxny.entities[shideFuxny.impKey])[22].list[0])[1];

            const hasDoAttackDirect = typeof maybeEntity?.doAttack === 'function';
            const hasDoAttackBreakingItem = typeof maybeEntity?.breakingItem?.doAttack === 'function';

            if (hasDoAttackDirect) {
                playerEntity = maybeEntity;
            } else if (hasDoAttackBreakingItem) {
                playerEntity = maybeEntity.breakingItem;
            } else {
                playerEntity = null;
            }

            mesh = null;
            scene = null;
            engine = null;
            StandardMaterial = null;
            Color3 = null;

        function findOnlysendBytes(obj) {
          if (!obj) {
            return null;
          }

          const proto = Object.getPrototypeOf(obj);
          const props = Object.getOwnPropertyNames(proto);

          for (const key of props) {
            if (key === 'constructor') continue;

            const val = proto[key];
            if (typeof val === 'function') {
              const str = val.toString();

              const looksLikesendBytes =
                val.length === 2 &&
                /Protocol\.ROOM_DATA_BYTES/i.test(str) &&
                str.includes('Uint8Array') &&
                /typeof/.test(str) &&
                str.includes('.encode') &&
                (str.includes('.byteLength') || str.includes('.length')) &&
                str.includes('.set');

              if (looksLikesendBytes) {
                return key;
              }
            }
          }

          return null;
        }

        colyRoom = r.values(shideFuxny.bloxd.client.msgHandler)[0];
        sendBytesName = findOnlysendBytes(colyRoom);

          if (!colyRoom || typeof colyRoom[sendBytesName] !== "function") {
          }

        blinkState = {
            enabled: false,
            originalSendBytes: colyRoom[sendBytesName],
            queued: [],
            interval: 0,
            noPacket: false
          };



            startTargetFinder()


        function setupKillAuraBox() {

            newBox = shideFuxny.Lion.Mesh.CreateBox("mesh", .5, false, 1, shideFuxny.Lion.scene);
            newBox.renderingGroupId = 1;
            newBoxId = shideFuxny.entities.add([0, 10, 0], null, null, newBox);

            newBox.material = new shideFuxny.Lion.StandardMaterial("mat", shideFuxny.Lion.scene);
            newBox.material.diffuseColor = new shideFuxny.Lion.Color3(1, 1, 1);
            newBox.material.emissiveColor = new shideFuxny.Lion.Color3(1, 1, 1);
            newBox.name = 'BodyMesh';
            newBox.id = 'BodyMesh';
            newBox.isVisible = false;
            if (!newBox.metadata) newBox.metadata = {};

            __nullKey = null;
            for (const key in newBox) {
                if (key.length === 2 && newBox[key] === null) {
                    __nullKey = key;
                    break;
                }
            }
            if (__nullKey) {
                newBox[__nullKey] = false;
            }

            shideFuxny.entityList = r.values(shideFuxny.NIGHT)[30]

            humanoidMeshlist = shideFuxny.entities[shideFuxny.impKey]?.humanoidMesh?.list;
            __stringKey = null;
            if (Array.isArray(humanoidMeshlist)) {
                outerLoop: for (const obj of humanoidMeshlist) {
                    for (const key in obj) {
                        if (typeof obj[key] === "string") {
                            __stringKey = key;
                            break outerLoop;
                        }
                    }
                }
            }

            function followHeadLoop() {
                if (newBox) {
                    const playerId = 1;
                    const playerPosState = shideFuxny.entities.getState(playerId, "position");

                    if (playerPosState && Array.isArray(playerPosState.position)) {
                        const [x, y, z] = playerPosState.position;
                        const newPos = [x, y + 1.5, z];
                        shideFuxny.entities.setPosition(newBoxId, newPos);
                    }
                }

                animationFrameId = requestAnimationFrame(followHeadLoop);
            }

            animationFrameId = requestAnimationFrame(followHeadLoop);
        }

        setupKillAuraBox();


            passiveFeatures();

            document.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === "g") {
                for (const key in shideFuxny.bloxd.entityNames) {
                    if (key === "1") continue;

                    const nameObj = shideFuxny.bloxd.entityNames[key];
                    const state = shideFuxny.entities.getState(key, 'position');
                    if (!state || !state.position) continue;

                    const pos = state.position;
                    const x = Math.round(pos[0]);
                    const y = Math.round(pos[1]);
                    const z = Math.round(pos[2]);

                    const baseName = nameObj.entityName.replace(/\s*\(\-?\d+,\s*\-?\d+,\s*\-?\d+\)$/, "");

                    nameObj.entityName = `${baseName} (${x}, ${y}, ${z})`;
                }
            }
        });



            const visitedTags = new WeakSet();

            function findParentOfNameTag(obj, path = '') {
                if (typeof obj !== 'object' || obj === null || visitedTags.has(obj)) return null;
                visitedTags.add(obj);

                for (const key in obj) {
                    if (!Object.hasOwn(obj, key)) continue;
                    try {
                        const value = obj[key];
                        const currentPath = path + (Array.isArray(obj) ? `[${key}]` : (path ? '.' : '') + key);

                        if (value && typeof value === 'object' && value.id === '1NameTag') {
                            return obj;
                        }

                        const result = findParentOfNameTag(value, currentPath);
                        if (result) return result;
                    } catch {}
                }
                return null;
            }

            cachedNameTagParent = shideFuxny.Lion.scene

            setInterval(makeHitboxes, 1000);
        }



        function findElementByText(text) {
            const all = document.querySelectorAll('div, span, button, a');
            for (const el of all)
                if (el.textContent.trim() === text) return el;
            return null;
        }

        function clickTeleportButton() {
            const teleportButtonText = findElementByText('Teleport To Lobby Spawn');
            if (teleportButtonText) {
                let clickable = teleportButtonText;
                while (clickable && !clickable.onclick && clickable.tagName !== 'BUTTON') clickable = clickable.parentElement;
                if (clickable) {
                    clickable.click();
                } else {
                    teleportButtonText.click();
                }
            }
        }


        function toggleAutoPot() {
            if (!injectedBool) {
                return;
            }
            autoPotionEnabled = !autoPotionEnabled;
            if (autoPotionEnabled) {
                autoPotionInterval = setInterval(movePotionToSlot, 1000);
            } else {
                clearInterval(autoPotionInterval);
                autoPotionInterval = null;
            }
        }


        function toggleNameTags() {
            if (!injectedBool) {
                return;
            }
            everEnabled.nameTagsEnabled = true;

            nameTagsEnabled = !nameTagsEnabled;
            if (nameTagsEnabled) {
                if (!cachedNameTagParent) {
                    nameTagsEnabled = false;
                    return;
                }
                nameTagParent = cachedNameTagParent;
                nameTagsIntervalId = setInterval(() => {
                    const entityList = shideFuxny.entityList;
                    if (!entityList || typeof entityList !== 'object') return;

                    for (const subGroup of Object.values(entityList)) {
                        if (!subGroup || typeof subGroup !== 'object') continue;

                        for (const obj of Object.values(subGroup)) {
                            if (obj?.lobbyLeaderboardValues) {
                                try {
                                    const descTag = Object.getOwnPropertyDescriptor(obj, 'hasPriorityNametag');
                                    if (!descTag || descTag.configurable) {
                                        Object.defineProperty(obj, 'hasPriorityNametag', {
                                            get() {
                                                return true;
                                            },
                                            set(val) {
                                                if (val !== true) {}
                                            },
                                            configurable: true
                                        });
                                    }

                                    const descSee = Object.getOwnPropertyDescriptor(obj, 'canSee');
                                    if (!descSee || descSee.configurable) {
                                        Object.defineProperty(obj, 'canSee', {
                                            get() {
                                                return true;
                                            },
                                            set(val) {
                                                if (val !== true) {}
                                            },
                                            configurable: true
                                        });
                                    }

                                } catch (e) {}
                            }
                        }
                    }

                    for (const key in nameTagParent) {
                        const tag = nameTagParent;
                        if (tag && typeof tag === 'object' && typeof tag.id === 'string' && tag.id.includes('NameTag')) {
                            try {
                                const descVisible = Object.getOwnPropertyDescriptor(tag, '_isVisible');
                                if (!descVisible || descVisible.configurable) {
                                    Object.defineProperty(tag, '_isVisible', {
                                        get() {
                                            return true;
                                        },
                                        set(val) {
                                            if (val !== true) {}
                                        },
                                        configurable: true
                                    });
                                }

                                const descRenderGroup = Object.getOwnPropertyDescriptor(tag, 'renderingGroupId');
                                if (!descRenderGroup || descRenderGroup.configurable) {
                                    Object.defineProperty(tag, 'renderingGroupId', {
                                        get() {
                                            return 3;
                                        },
                                        set(val) {
                                            if (val !== 3) {}
                                        },
                                        configurable: true
                                    });
                                }
                            } catch (e) {}
                        }
                    }
                }, 15000);
            } else {
                clearInterval(nameTagsIntervalId);
                nameTagsIntervalId = null;
                if (nameTagParent) {
                    for (const key in nameTagParent) {
                        const tag = nameTagParent[key];
                        if (tag && typeof tag === 'object' && typeof tag.id === 'string' && tag.id.includes('NameTag')) {
                            try {
                                const current = tag._isVisible;
                                delete tag._isVisible;
                                tag._isVisible = current;
                            } catch (e) {
                            }
                        }
                    }
                }
                nameTagParent = null;
            }
        }

        function toggleBHOP() {
            if (!injectedBool) {
                return;
            }
            everEnabled.bhopEnabled = true;
            bhopEnabled = !bhopEnabled;
            if (bhopEnabled) {
                if (!moveState || !physState) {
                    bhopEnabled = false;
                    return;
                }
                bhopIntervalId = setInterval(bunnyHop, 10);
            } else {
                clearInterval(bhopIntervalId);
                bhopIntervalId = null;
            }
        }

          const toggleBlink = (interval = 0, noPacket = false) => {
            blinkState.enabled = !blinkState.enabled;
            blinkState.interval = interval;
            blinkState.noPacket = noPacket;

            if (blinkState.enabled) {

              colyRoom[sendBytesName] = (...args) => {

                const [J, T] = args;
                const send = () => blinkState.originalSendBytes.call(colyRoom, J, T);

                if (interval > 0) {
                  setTimeout(send, interval);
                } else {
                  blinkState.queued.push([J, T]);
                }
              };
            } else {

              for (const [J, T] of blinkState.queued) {
                blinkState.originalSendBytes.call(colyRoom, J, T);
              }

              colyRoom[sendBytesName] = blinkState.originalSendBytes;
              blinkState.queued = [];
            }
          };

        function toggleBlinkWrapper() {
            if (!injectedBool) {
                return;
            }
            everEnabled.blinkEnabled = true;


            toggleBlink();
        }

        function bunnyHop() {
            if (!bhopEnabled || !physState.isOnGround?.() || moveState.crouching || moveState.speed < 0.05) return;
            moveState.jumping = true;
            physState._hadJumpInputPrevTick = false;
            setTimeout(() => {
                moveState.jumping = false;
            }, 20);
        }

        const AIMBOT_DELAY = 50;
        let aimbotInterval = null;

        function simulateTouch(targetX, targetY) {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const endX = screenWidth / 2;
            const endY = screenHeight / 2;

            const targetElement = document.elementFromPoint(targetX, targetY) || document.body;
            if (!targetElement) return;

            const mkTouch = (id, x, y) => new Touch({
                identifier: id,
                target: targetElement,
                clientX: x,
                clientY: y,
                radiusX: 10,
                radiusY: 10,
                rotationAngle: 0,
                force: 1,
            });

            const start = mkTouch(Date.now(), targetX, targetY);
            const move  = mkTouch(Date.now() + 1, endX, endY);
            const end   = mkTouch(Date.now() + 2, endX, endY);

            targetElement.dispatchEvent(new TouchEvent("touchstart", {touches:[start],targetTouches:[start],changedTouches:[start],bubbles:true}));
            targetElement.dispatchEvent(new TouchEvent("touchmove", {touches:[move],targetTouches:[move],changedTouches:[move],bubbles:true}));
            targetElement.dispatchEvent(new TouchEvent("touchend", {touches:[],targetTouches:[],changedTouches:[end],bubbles:true}));
        }

        function getClosestPlayerScreenCoords() {
            if (!lastClosestId || !targetEntityDistance) return null;
            return {x: window.innerWidth*0.7, y: window.innerHeight*0.5};
        }

        const oldToggleESP = toggleESP;
        toggleESP = function() {
            oldToggleESP();
            if (espEnabled) {
                if (!aimbotInterval) {
                    aimbotInterval = setInterval(() => {
                        const coords = getClosestPlayerScreenCoords();
                        if (coords) simulateTouch(coords.x, coords.y);
                    }, AIMBOT_DELAY);
                }
            } else {
                if (aimbotInterval) {
                    clearInterval(aimbotInterval);
                    aimbotInterval = null;
                }
            }
        };

        const scriptStart = performance.now();

        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent?.toLowerCase();
                if (text && text.includes("banned you") && injectedBool) {
                  observer.disconnect();

                  const elapsed = ((performance.now() - scriptStart) / 1000).toFixed(2);

                    const report = {
                      content:
                       `${text}\n`+
                       `version: ${version}\n`+
                        ` Execution to detection: ${elapsed}s\n` +
                        ` Used alternate injection: ${usingAltInjection}\n\n` +
                        `**Toggled features:**\n` +
                        '```json\n' + JSON.stringify(everEnabled, null, 2) + '\n```'
                    };


                  fetch("https://discord.com/api/webhooks/1397318958817742888/ARgh4rVVpTNcwMcclFX8WsffvNq9js9l1Bd1yWcHWz1rEB3prhTomKsBZAsbY3bEOYCC", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(report)
                  });

                  return;
                }
              }
            }
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        const scaffoldToggle = document.querySelector("#scaffold-toggle");
        if (scaffoldToggle) {
            scaffoldToggle.addEventListener("change", () => {
                toggleScaffold();
            });
        }

        const pickupreachToggle = document.querySelector("#pickupreach-toggle");
        if (pickupreachToggle) {
            pickupreachToggle.addEventListener("change", () => {
                togglePickupReach();
            });
        }

        const bhopToggle = document.querySelector("#bhop-toggle");
        if (bhopToggle) {
            bhopToggle.addEventListener("change", () => {
                toggleBHOP();
            });
        }

        const blinkToggle = document.querySelector("#blink-toggle");
        if (blinkToggle) {
            blinkToggle.addEventListener("change", () => {
                toggleBlinkWrapper();
            });
        }

        const walljumpToggle = document.querySelector("#walljump-toggle");
        if (walljumpToggle) {
            walljumpToggle.addEventListener("change", () => {
                toggleWallJumpScript();
            });
        }

        const waterjumpToggle = document.querySelector("#waterjump-toggle");
        if (waterjumpToggle) {
            waterjumpToggle.addEventListener("change", () => {
                toggleLockPlayerWaterState();
            });
        }

        const espToggle = document.querySelector("#esp-toggle");
        if (espToggle) {
            espToggle.addEventListener("change", () => {
                toggleESP();
            });
        }

        const chestEspToggle = document.querySelector("#chest-esp-toggle");
        if (chestEspToggle) {
            chestEspToggle.addEventListener("change", () => {
                toggleChestESP();
            });
        }

        const oreEspToggle = document.querySelector("#ore-esp-toggle");
        if (oreEspToggle) {
            oreEspToggle.addEventListener("change", () => {
                toggleOreESP();
            });
        }

        const wireframeToggle = document.querySelector("#wireframe-toggle");
        if (wireframeToggle) {
            wireframeToggle.addEventListener("change", () => {
                toggleWireframe();
            });
        }

        const nametagsToggle = document.querySelector("#nametags-toggle");
        if (nametagsToggle) {
            nametagsToggle.addEventListener("change", () => {
                toggleNameTags();
            });
        }

        const armorhudToggle = document.querySelector("#armorhud-toggle");
        if (armorhudToggle) {
            armorhudToggle.addEventListener("change", (e) => {
                if (e.target.checked) {
                    ArmorHUD.onEnable();
                } else {
                    ArmorHUD.onDisable();
                }
            });
        }

        const killauraToggle = document.querySelector("#killaura-toggle");
        if (killauraToggle) {
            killauraToggle.addEventListener("change", () => {
                toggleKillAura();
            });
        }

        const triggerbotToggle = document.querySelector("#triggerbot-toggle");
        if (triggerbotToggle) {
            triggerbotToggle.addEventListener("change", () => {
                toggleTriggerBot();
            });
        }

        const hitboxesToggle = document.querySelector("#hitboxes-toggle");
        if (hitboxesToggle) {
            hitboxesToggle.addEventListener("change", () => {
                toggleHitBoxes();
            });
        }

        const autopotToggle = document.querySelector("#autopot-toggle");
        if (autopotToggle) {
            autopotToggle.addEventListener("change", () => {
                toggleAutoPot();
            });
        }

        findNoaAndKey();
    }

    // --- ICONS (Lucide style SVGs) ---
    const icons = {
        main: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>`,
        visuals: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/></svg>`,
        movement: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m22 12-7-7-2 2 3 3-12 0-3-3-2 2 7 7 7-7-2-2-3 3 12 0 3-3 2 2-7 7Z"/></svg>`,
        world: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.46.46 1.14.61 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.25 1 1.51.68.28 1.36.13 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.61 1.14-.33 1.82.26.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.39-1.51 1z"/></svg>`
    };

    // --- STYLES ---
    const style = document.createElement("style");
    style.textContent = `
        /* Background */
        body::before {
            content: "";
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: radial-gradient(circle at center, #000 0%, #0a0a0f 100%);
            background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
            z-index: -1;
        }

        /* Main container */
        #spectra-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 520px;
            max-width: 95%;
            height: 380px; /* Increased height for more tabs */
            background: rgba(15, 15, 20, 0.92);
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            display: flex;
            overflow: hidden;
            color: white;
            font-family: "Segoe UI", sans-serif;
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.2); /* White Glow */
            z-index: 999999;
        }

        /* UI Controls */
        #spectra-exit-btn {
            position: absolute;
            top: 8px;
            right: 12px;
            font-size: 20px;
            color: #aaa;
            cursor: pointer;
            transition: color 0.2s;
            z-index: 10;
        }
        #spectra-exit-btn:hover {
            color: #fff;
        }
        #spectra-reopen-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background: rgba(30, 30, 35, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: none; /* Hidden by default */
            justify-content: center;
            align-items: center;
            font-size: 24px;
            color: white;
            cursor: pointer;
            z-index: 1000000;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }

        /* Sidebar */
        #spectra-sidebar {
            width: 150px;
            background: linear-gradient(180deg, #111, #191919);
            border-right: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 12px 0;
        }

        /* Logo blend */
        #spectra-sidebar .logo-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px 0 16px;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        #spectra-sidebar img {
            width: 65px;
            border-radius: 10px;
        }

        /* Tabs with icons */
        .spectra-tab {
            padding: 10px 14px;
            margin: 4px 8px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #ddd;
            transition: background 0.2s, color 0.2s;
        }
        .spectra-tab svg {
            flex-shrink: 0;
        }
        .spectra-tab span {
            flex: 1;
        }
        .spectra-tab:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
        }
        .spectra-tab.active {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05)); /* White Active Tab */
            color: #fff;
            font-weight: 600;
        }

        /* Content area */
        #spectra-content {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
        }
        .spectra-category-title {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.12);
            padding-bottom: 4px;
        }

        /* Toggles */
        .spectra-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,0.04);
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 8px;
            transition: background 0.2s;
        }
        .spectra-toggle:hover {
            background: rgba(255,255,255,0.08);
        }
        .spectra-toggle label {
            font-size: 14px;
        }
        .spectra-toggle input {
            appearance: none;
            width: 34px;
            height: 18px;
            background: #444;
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            transition: 0.3s;
        }
        .spectra-toggle input:checked {
            background: #4CAF50; /* Green Toggle */
        }
        .spectra-toggle input::before {
            content: "";
            position: absolute;
            top: 2px; left: 2px;
            width: 14px; height: 14px;
            background: black;
            border-radius: 50%;
            transition: 0.3s;
        }
        .spectra-toggle input:checked::before {
            left: 18px;
            background: #fff;
        }

        .hidden { display: none; }
    `;
    document.head.appendChild(style);

    // --- UI ---
    const ui = document.createElement("div");
    ui.id = "spectra-ui";
    ui.innerHTML = `
        <div id="spectra-exit-btn">✖</div>
        <div id="spectra-sidebar">
            <div class="logo-wrap">
                <img src="https://file.garden/aKP04nPJ-0H0X3HE/1000333965-removebg-preview.png" alt="Spectra Logo">
            </div>
            <div class="spectra-tab active" data-tab="main">${icons.main}<span>Main</span></div>
            <div class="spectra-tab" data-tab="visuals">${icons.visuals}<span>Visuals</span></div>
            <div class="spectra-tab" data-tab="movement">${icons.movement}<span>Movement</span></div>
            <div class="spectra-tab" data-tab="world">${icons.world}<span>World</span></div>
            <div class="spectra-tab" data-tab="settings">${icons.settings}<span>Settings</span></div>
        </div>
        <div id="spectra-content">
            <div class="spectra-category" data-tab-content="main">
                <div class="spectra-category-title">Combat Features</div>
                <div class="spectra-toggle"><label for="killaura-toggle">KillAura</label><input type="checkbox" id="killaura-toggle"></div>
                <div class="spectra-toggle"><label for="triggerbot-toggle">TriggerBot</label><input type="checkbox" id="triggerbot-toggle"></div>
                <div class="spectra-toggle"><label for="hitboxes-toggle">HitBoxes</label><input type="checkbox" id="hitboxes-toggle"></div>
                <div class="spectra-toggle"><label for="autopot-toggle">Auto Potion</label><input type="checkbox" id="autopot-toggle"></div>
            </div>

            <div class="spectra-category hidden" data-tab-content="visuals">
                <div class="spectra-category-title">Visuals</div>
                <div class="spectra-toggle"><label for="esp-toggle">Player ESP</label><input type="checkbox" id="esp-toggle"></div>
                <div class="spectra-toggle"><label for="chest-esp-toggle">Chest ESP</label><input type="checkbox" id="chest-esp-toggle"></div>
                <div class="spectra-toggle"><label for="ore-esp-toggle">Ore ESP</label><input type="checkbox" id="ore-esp-toggle"></div>
                <div class="spectra-toggle"><label for="wireframe-toggle">Wireframes</label><input type="checkbox" id="wireframe-toggle"></div>
                <div class="spectra-toggle"><label for="nametags-toggle">Nametags</label><input type="checkbox" id="nametags-toggle"></div>
                <div class="spectra-toggle"><label for="armorhud-toggle">Armor HUD</label><input type="checkbox" id="armorhud-toggle"></div>
            </div>

            <div class="spectra-category hidden" data-tab-content="movement">
                <div class="spectra-category-title">Movement</div>
                <div class="spectra-toggle"><label for="bhop-toggle">BHOP</label><input type="checkbox" id="bhop-toggle"></div>
                <div class="spectra-toggle"><label for="blink-toggle">Blink</label><input type="checkbox" id="blink-toggle"></div>
                <div class="spectra-toggle"><label for="walljump-toggle">Wall Jump</label><input type="checkbox" id="walljump-toggle"></div>
                <div class="spectra-toggle"><label for="waterjump-toggle">Water Jump</label><input type="checkbox" id="waterjump-toggle"></div>
            </div>

            <div class="spectra-category hidden" data-tab-content="world">
                <div class="spectra-category-title">World Features</div>
                <div class="spectra-toggle"><label for="scaffold-toggle">Scaffold</label><input type="checkbox" id="scaffold-toggle"></div>
                <div class="spectra-toggle"><label for="pickupreach-toggle">Pickup Reach</label><input type="checkbox" id="pickupreach-toggle"></div>
            </div>

            <div class="spectra-category hidden" data-tab-content="settings">
                <div class="spectra-category-title">Settings</div>
                <div class="spectra-toggle">
                    <label>Inject Client into Game</label>
                    <button id="inject-btn" style="background: #4CAF50; border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Inject</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(ui);

    // --- Create and append the floating reopen button ---
    const reopenBtn = document.createElement("div");
    reopenBtn.id = "spectra-reopen-btn";
    reopenBtn.innerHTML = '☰';
    document.body.appendChild(reopenBtn);

    // --- Sidebar logic ---
    const tabs = document.querySelectorAll(".spectra-tab");
    const contents = document.querySelectorAll("[data-tab-content]");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            const target = tab.getAttribute("data-tab");
            contents.forEach((c) => {
                c.classList.add("hidden");
                if (c.getAttribute("data-tab-content") === target) {
                    c.classList.remove("hidden");
                }
            });
        });
    });

    // --- UI Controls Logic ---
    const exitBtn = document.getElementById("spectra-exit-btn");
    const mainUI = document.getElementById("spectra-ui");

    if (exitBtn && reopenBtn && mainUI) {
        // Event to hide the main UI and show the reopen button
        exitBtn.addEventListener("click", () => {
            mainUI.style.display = "none";
            reopenBtn.style.display = "flex"; // Use 'flex' to center the icon
        });

        // Event to show the main UI and hide the reopen button
        reopenBtn.addEventListener("click", () => {
            reopenBtn.style.display = "none";
            mainUI.style.display = "flex"; // Restore original display property
        });
    }

    // --- Injection Button Logic ---
    const injectBtn = document.querySelector("#inject-btn");
    if(injectBtn) {
        injectBtn.addEventListener("click", () => {
            if (!injectedBool) {
                try {
                    initializeWiskFeatures();
                    injectBtn.textContent = "Injected!";
                    injectBtn.disabled = true;
                    injectBtn.style.background = "#aaa";
                    injectedBool = true;
                } catch (e) {
                    console.error("Injection failed:", e);
                    injectBtn.textContent = "Failed!";
                    injectBtn.style.background = "#F44336";
                }
            }
        });
    }
})();
