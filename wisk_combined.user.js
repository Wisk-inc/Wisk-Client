// ==UserScript==
// @name         Spectra Client (Wisk Features)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Hacks from wiskorginal8227282_blink_scaffold_advanced.txt with the Spectra Client UI
// @author       Jules
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //__START__HACK_CODE______________________________________________

    let Fuxny = {};
    let defaultAccent = "#FF0000";

    const TITLE = "Midnight__" //-----------------------Title


    const changeHealthBar = true // --------------------Change health bar color to gradient color
    const spoofRanksEnabled = true; // -----------------Gives you all ranks (YT, Super, Developer)
    const ATTACK_INTERVAL_MS = 20; // -----------------How fast to hit players with triggerbot/killAura    LOW = BAN
    let desiredPotionSlot = 1 //------------------------What slot should potions go to? Numbers start at zero! 0-9
    let spikeSlot = 8 //--------------------------------What slot do spikes automatically go in? 0-9
    let webSlot = 9 //----------------------------------What slot do webs / nets automatically go in? 0-9


    let alreadyConnected = null;
    let colyRoom = null;
    let sendBytesName = null;
    let gameObjects = {};
    let injectedBool = false;
    let myId = 1
    let isInitializing = true;
    let clientOptions = null;
    let noaParent = null;
    let noaKeyInParent = null;
    let blinkState = {
        enabled: false,
        originalSendBytes: null,
        queued: [],
        interval: 0,
        noPacket: false
    };

    let everEnabled = {}

    let wallJumpInterval = null;
    let wallJumpRunning = false;


    let lockPlayerWaterStateInterval = null;
    let waterJumpingEnabled = false


    let wireFramesBool = false;


    let espEnabled = false;

    let chestESPEnabled = false;
    let oreESPEnabled = false;
    let chestOreInterval = null;
    let chestBoxes = {};



    let isSkyboxHidden = false;


    let triggerBotEnabled = false;
    let toggleTriggerBotInterval = null;


    const possibleNames = [
        "BodyMesh",
        'Body|Armour',
    ];
    let killAuraEnabled = false
    let killAuraIntervalId = null
    let killshotEnabled = false
    let killshotInterval = null
    let inventoryCleanerEnabled = false
    let inventoryCleanerInterval = null
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

    let scaffoldEnabled = false;
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
    let antiBanEnabled = false;


    const scannedChunks = new Set();
    let chunkDataField = null;

    // ETC
    let playerKey = null;
    let moveState = null;
    let physState = null;
    let humanoidMeshlist = null;
    let playerEntity = null;
    let skyboxEntity = null;
    let skyboxMesh = null;
    let bigHeadsInterval = null;
    let targetFinderId = null;
    let setHealthBar = null;
    let playerInventoryParent = null;


    let distance = 0.1;
    let moveInterval = null;
    let lastUpTime = 0;



    var S = {
        normalizeVector(t) { let e = t[0] * t[0] + t[1] * t[1] + t[2] * t[2]; if (e > 0) { let i = 1 / Math.sqrt(e); return [t[0] * i, t[1] * i, t[2] * i] } return t },
        distanceBetween(t, e) { let i = e[0] - t[0], o = e[1] - t[1], s = e[2] - t[2]; return i * i + o * o + s * s },
        distanceBetweenSqrt(t, e) { return Math.sqrt(this.distanceBetween(t, e)) },
        lerp(t, e, i) { return t + (e - t) * i }
    };
    var D = {
        fakeMouseEvent(t) {
            let e = { button: 0, buttons: 1, clientX: Math.floor(Math.random() * 999 + 1), clientY: Math.floor(Math.random() * 999 + 1), screenX: Math.floor(Math.random() * 999 + 1), screenY: Math.floor(Math.random() * 999 + 1), target: document.querySelector("#noa-container"), type: t, isTrusted: !0, view: window, bubbles: !0, cancelable: !0, timeStamp: performance.now() };
            return e.prototype = MouseEvent.prototype, e
        }
    };
    var C = {
        wpRequire: null, _cachedNoa: null,
        get noa() { return this?._cachedNoa || (this._cachedNoa = r.values(this.bloxdProps).find(t => t?.entities)), this._cachedNoa },
        init() {
            let t = Object.getOwnPropertyDescriptors(window), e = Object.keys(t).find(s => t[s]?.set?.toString().includes("++")), i = window[e] = window[e], o = Math.floor(Math.random() * 9999999 + 1);
            i.push([ [o], {}, s => this.wpRequire = s ]), this.bloxdProps = r.values(this.findModule("nonBlocksClient:")).find(s => typeof s == "object")
        },
        findModule(t) { let e = this.wpRequire.m; for (let i in e) { let o = e[i]; if (o && o.toString().includes(t)) return this.wpRequire(i) } return null }
    }, l = C;
    var I = {
        getPosition(t) { return l.noa.entities.getState(t, "position").position },
        get getMoveState() { return r.values(l.noa.entities)[36] },
        getPhysicsBody(t) { return l.noa.entities.getState(t, "physics").body },
        get registry() { return r.values(l.noa)[17] },
        get getBlockSolidity() { return r.values(this.registry)[5] },
        get getBlockID() { return l.noa.bloxd[Object.getOwnPropertyNames(l.noa.bloxd.constructor.prototype)[3]].bind(l.noa.bloxd) },
        get getHeldItem() { return r.values(l.noa.entities).find(t => t?.length == 1 && t?.toString()?.length < 13 && t?.toString().includes(").")) },
        safeGetHeldItem(t) { let e; try { e = this.getHeldItem(t) } catch {} return e },
        get playerList() { return r.values(l.noa.bloxd.getPlayerIds()).filter(t => t !== 1 && this.safeGetHeldItem(t)).map(t => parseInt(t)) },
        get doAttack() { let t = this.safeGetHeldItem(1); return (t?.doAttack || t.breakingItem.doAttack).bind(t) },
        setVelocity(t = null, e = null, i = null) { let o = this.getPhysicsBody(1), s = r.values(o)[16]; t !== null && (s[0] = t), e !== null && (s[1] = e), i !== null && (s[2] = i) },
        isAlive(t) { return r.values(l.noa.entities)[37](t).isAlive },
        touchingWall() { let t = this.getPosition(1), e = .35, i = [ [0, 0, 0], [e, 0, 0], [-e, 0, 0], [0, 0, e], [0, 0, -e], [e, 0, e], [e, 0, -e], [-e, 0, e], [-e, 0, -e] ], o = [0, 1, 2]; for (let [s, c, d] of i) for (let u of o) { let m = Math.floor(t[0] + s), h = Math.floor(t[1] + c + u), E = Math.floor(t[2] + d), M = this.getBlockID(m, h, E); if (this.getBlockSolidity(M)) return !0 } return !1 }
    };
    var n = { noa: I, mouse: D };

    var r = { //WANG
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
            fadeVolume(spaceVid.volume, 0.1, 2.5);
        }
    }

    function onKeyUp(e) {
        if (e.code === 'Space') {
            spaceHeld = false;
            spaceVid.style.opacity = '0';
            fadeVolume(spaceVid.volume, 0.1, 2.5);
            setTimeout(() => {
                if (!spaceHeld) spaceVid.pause();
            }, 500);
        }
    }

    function showTemporaryNotification(message, duration = 1500) {
        const defaultBackGroundColor = 'rgba(0, 0, 0, 0.5)';
        const defaultBackGroundBlur = 9;
        const defaultAccent = "#FF0000";

        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.bottom = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.zIndex = '132';
            document.body.appendChild(notificationContainer);
        }

        const notification = document.createElement('div');
        notification.textContent = message;

        notification.style.padding = '12px';
        notification.style.color = '#fff';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        notification.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.marginBottom = '10px';
        notification.style.backgroundColor = defaultBackGroundColor;
        notification.style.backdropFilter = `blur(${defaultBackGroundBlur}px)`;
        notification.style.border = `2px solid ${defaultAccent}`;

        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
                if (notificationContainer.children.length === 0) {
                    notificationContainer.remove();
                }
            }, 500);
        }, duration);
    }

    // --- Start of Wisk Features ---

    function toggleESP() {
        if (!injectedBool) {
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-esp').checked = false;
            return;
        }
        everEnabled.espEnabled = true;
        espEnabled = !espEnabled;
        const groupId = espEnabled ? 2 : 0;

        if (Array.isArray(r.values(Fuxny.rendering)[18].thinMeshes)) {
            for (const thinMesh of r.values(Fuxny.rendering)[18].thinMeshes) {
                if (thinMesh?.mesh && typeof thinMesh.mesh.renderingGroupId === "number") {
                    thinMesh.mesh.renderingGroupId = groupId;
                }
            }
        }
        showTemporaryNotification('ESP toggled: ' + espEnabled);
    }

    function clearESPBoxes() {
        for (const key in chestBoxes) {
            for (const { mesh, id } of chestBoxes[key]) {
                mesh.dispose();
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
        const blockData = chunk[Object.keys(chunk).find(k => chunk[k]?.stride)];
        if (!blockData) return;

        const { data, stride } = blockData;
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

            const mesh = Fuxny.Lion.Mesh.CreateBox("espbox", 0.5, false, 1, Fuxny.Lion.scene);
            mesh.position.set(worldX, worldY, worldZ);
            mesh.renderingGroupId = 1;
            mesh.material = new Fuxny.Lion.StandardMaterial("mat", Fuxny.Lion.scene);

            const id = Fuxny.Lion.addComponent([worldX, worldY, worldZ], null, null, mesh);
            if (!chestBoxes[chunkKey]) chestBoxes[chunkKey] = [];
            chestBoxes[chunkKey].push({ mesh, id });

            if ([204, 205, 206, 207].includes(blockID)) {
                mesh.material.diffuseColor = new Fuxny.Lion.Color3(1, 0.5, 0);
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(1, 0.5, 0);
            }
            if (blockID === 45) {
                mesh.material.diffuseColor = new Fuxny.Lion.Color3(0, 0, 1);
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(0, 0, 1);
            }
            if (blockID === 465) {
                mesh.material.diffuseColor = new Fuxny.Lion.Color3(0.7, 0.5, 1);
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(0.7, 0.5, 1);
            }
        }
    }

    function scanAllChunks() {
        if (!Fuxny?.world || !Fuxny?.world?.[Fuxny.impKey]?.hash) return;
        const chunkHash = Fuxny.world[Fuxny.impKey].hash;
        for (const scannedKey of scannedChunks) {
            if (!(scannedKey in chestBoxes)) continue;
            if (!Object.values(chunkHash).some(chunk => getChunkKey(chunk) === scannedKey)) {
                for (const { mesh } of chestBoxes[scannedKey]) {
                    mesh.dispose();
                }
                delete chestBoxes[scannedKey];
                scannedChunks.delete(scannedKey);
            }
        }

        for (const chunkKey in chunkHash) {
            const chunk = chunkHash[chunkKey];
            const blockData = chunk[Object.keys(chunk).find(k => chunk[k]?.stride)];
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
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-chest-esp').checked = false;
            return;
        }
        everEnabled.chestESPEnabled = true;
        chestESPEnabled = !chestESPEnabled;
        if (chestESPEnabled || oreESPEnabled) {
            if (!chestOreInterval) {
                scanAllChunks();
                chestOreInterval = setInterval(scanAllChunks, 5000);
            }
        } else {
            if (!oreESPEnabled) {
                clearInterval(chestOreInterval);
                chestOreInterval = null;
                clearESPBoxes();
            }
        }
        showTemporaryNotification('ChestESP toggled: ' + chestESPEnabled);
    }

    function toggleOreESP() {
        if (!injectedBool) {
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-ore-esp').checked = false;
            return;
        }
        everEnabled.oreESPEnabled = true;
        oreESPEnabled = !oreESPEnabled;
        if (chestESPEnabled || oreESPEnabled) {
            if (!chestOreInterval) {
                scanAllChunks();
                chestOreInterval = setInterval(scanAllChunks, 5000);
            }
        } else {
            if (!chestESPEnabled) {
                clearInterval(chestOreInterval);
                chestOreInterval = null;
                clearESPBoxes();
            }
        }
        showTemporaryNotification('OreESP toggled: ' + oreESPEnabled);
    }

    function toggleBHOP() {
        if (!injectedBool) {
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-bhop').checked = false;
            return;
        }
        everEnabled.bhopEnabled = true;
        bhopEnabled = !bhopEnabled;
        if (bhopEnabled) {
            if (!moveState || !physState) {
                bhopEnabled = false;
                document.getElementById('hack-bhop').checked = false;
                return;
            }
            bhopIntervalId = setInterval(bunnyHop, 10);
        } else {
            clearInterval(bhopIntervalId);
            bhopIntervalId = null;
        }
        showTemporaryNotification('BHOP toggled: ' + bhopEnabled);
    }

    function bunnyHop() {
        if (!bhopEnabled || !physState.isOnGround?.() || moveState.crouching || moveState.speed < 0.05) return;
        moveState.jumping = true;
        physState._hadJumpInputPrevTick = false;
        setTimeout(() => {
            moveState.jumping = false;
        }, 20);
    }

    function toggleWallJumpScript() {
        if (!injectedBool) {
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-walljump').checked = false;
            return;
        }
        everEnabled.wallJumpRunning = true;
        const client = Fuxny?.clientOptions;
        const body = Fuxny?.physics?.bodies?.[0];
        if (!client || !body) return;

        wallJumpRunning = !wallJumpRunning;

        if (!wallJumpRunning) {
            Object.defineProperty(client, "airJumpCount", { value: 0, writable: true, configurable: true });
        } else {
            Object.defineProperty(client, "airJumpCount", {
                get() {
                    if (!body.resting) return 0;
                    const [rx, , rz] = body.resting;
                    return (rx === 1 || rx === -1 || rz === 1 || rz === -1) ? 999 : 0;
                },
                set(_) {},
                configurable: true
            });
        }
        showTemporaryNotification('Wall Jump toggled: ' + wallJumpRunning);
    }

    function toggleScaffold() {
        if (!injectedBool) {
            showTemporaryNotification('You need to inject first!');
            document.getElementById('hack-scaffold').checked = false;
            return;
        }
        everEnabled.scaffoldEnabled = true;
        scaffoldEnabled = !scaffoldEnabled;
        if (scaffoldEnabled) {
            scaffoldIntervalId = setInterval(() => {
                if (!playerEntity) return;
                const pos = Fuxny.entities.getState(1, 'position').position;
                if (!pos || playerEntity.heldItemState.heldType !== "CubeBlock") return;

                const exactX = pos[0];
                const exactZ = pos[2];
                const blockX = Math.floor(exactX);
                const blockY = Math.floor(pos[1]);
                const blockZ = Math.floor(exactZ);

                const checkPlace = (x, y, z) => (playerEntity.checkTargetedBlockCanBePlacedOver([x, y, z]) || r.values(Fuxny.world)[47].call(Fuxny.world, x, y, z) === 0);

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
        showTemporaryNotification('Scaffold toggled: ' + scaffoldEnabled);
    }

    function wangPlace(position) {
        if (!playerEntity) return;
        let heldBlock = playerEntity.heldItemState._blockItem;
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

    // --- End of Wisk Features ---

    function stopMoving() {
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
    }

    function startMoving() {
        if (moveInterval) return;

        moveInterval = setInterval(() => {
            let pos = Fuxny.entities.getState(1, 'position').position;
            let h = Fuxny.camera.heading;
            let p = Fuxny.camera.pitch;

            let newX = pos[0], newY = pos[1], newZ = pos[2];
            const now = Date.now();

            if (p < -1) {
                if (now - lastUpTime >= 500) {
                    newY += distance + 0.9;
                    lastUpTime = now;
                }
            } else if (p > 1) {
                newY -= distance;
            } else {
                newX += Math.sin(h) * distance;
                newZ += Math.cos(h) * distance;
            }
            Fuxny.entities.setPosition(1, newX, newY, newZ);
        }, 20);
    }

    function dumpAllFunctions(obj, includePrototype = false) {
        const seen = new Set();
        let current = obj;
        let index = 1;
        console.group(`📦 Function Dump`);
        do {
            const props = Object.getOwnPropertyNames(current);
            for (const key of props) {
                if (seen.has(key)) continue;
                seen.add(key);
                try {
                    const val = obj[key];
                    if (typeof val === "function") {
                        console.groupCollapsed(`🔹 [${index++}] ${key}()`);
                        console.log(val.toString());
                        console.groupEnd();
                    }
                } catch (e) {
                    console.warn(`⚠️ Could not access function '${key}':`, e);
                }
            }
            current = includePrototype ? Object.getPrototypeOf(current) : null;
        } while (current && current !== Object.prototype);
        console.groupEnd();
    }

    // ... Rest of Spectra Client code ...

    // --- UI and Event Listeners ---
    const icons = {
        main: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>`,
        visuals: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/></svg>`,
        experimental: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.46.46 1.14.61 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.25 1 1.51.68.28 1.36.13 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.61 1.14-.33 1.82.26.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.39-1.51 1z"/></svg>`
    };

    const style = document.createElement("style");
    style.textContent = `
        #spectra-ui {
            --primary-color: #D30000;
            --secondary-color: #3e0000;
            --text-color: #ffffff;
            --bg-color: rgba(15, 15, 20, 0.92);
            --border-color: rgba(255, 255, 255, 0.1);
            --hover-bg-color: rgba(255, 255, 255, 0.15);
            --font-family: "Segoe UI", sans-serif;
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 520px; max-width: 95%; height: 320px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 14px; border: 1px solid var(--border-color);
            display: flex; overflow: hidden;
            color: var(--text-color); font-family: var(--font-family);
            box-shadow: 0 0 25px var(--primary-color);
            z-index: 999999;
            transition: background 0.5s, box-shadow 0.5s, color 0.5s, font-family 0.5s;
        }
        #spectra-ui * { font-family: var(--font-family); }
        #spectra-exit-btn { position: absolute; top: 8px; right: 12px; font-size: 20px; color: var(--text-color); opacity: 0.7; cursor: pointer; transition: opacity 0.2s; z-index: 10; }
        #spectra-exit-btn:hover { opacity: 1; }
        #spectra-reopen-btn { position: fixed; top: 20px; left: 20px; width: 40px; height: 40px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; display: none; justify-content: center; align-items: center; font-size: 24px; color: var(--text-color); cursor: pointer; z-index: 1000000; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
        #spectra-sidebar { width: 150px; background: var(--bg-color); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: stretch; padding: 12px 0; }
        #spectra-sidebar .logo-wrap { display: flex; justify-content: center; align-items: center; padding: 8px 0 16px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); }
        #spectra-sidebar img { width: 65px; border-radius: 10px; }
        .spectra-tab { padding: 10px 14px; margin: 4px 8px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-color); opacity: 0.8; transition: background 0.2s, color 0.2s, opacity 0.2s; }
        .spectra-tab svg { flex-shrink: 0; }
        .spectra-tab span { flex: 1; }
        .spectra-tab:hover { background: var(--hover-bg-color); opacity: 1; }
        .spectra-tab.active { background: linear-gradient(90deg, var(--primary-color), transparent); color: var(--text-color); font-weight: 600; opacity: 1; }
        #spectra-content { flex: 1; background: var(--bg-color); padding: 16px; overflow-y: auto; }
        .spectra-category-title { font-size: 15px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; color: var(--primary-color); }
        .spectra-toggle, .spectra-button, .spectra-setting { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 8px 12px; margin: 5px 0; border-radius: 8px; transition: background 0.2s; }
        .spectra-toggle:hover, .spectra-button:hover, .spectra-setting:hover { background: var(--hover-bg-color); }
        .spectra-button { color: var(--text-color); font-size: 14px; border: 1px solid var(--border-color); cursor: pointer; text-align: center; width: 100%; }
        .spectra-toggle label, .spectra-setting label { font-size: 14px; }
        .spectra-toggle input[type="checkbox"] { appearance: none; width: 34px; height: 18px; background: #444; border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s; }
        .spectra-toggle input[type="checkbox"]:checked { background: var(--primary-color); }
        .spectra-toggle input[type="checkbox"]::before { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: black; border-radius: 50%; transition: 0.3s; }
        .spectra-toggle input[type="checkbox"]:checked::before { left: 18px; background: #fff; }
        .hidden { display: none; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement("div");
    ui.id = "spectra-ui";
    ui.innerHTML = `
        <div id="spectra-exit-btn">✖</div>
        <div id="spectra-sidebar">
            <div class="logo-wrap"><img src="https://file.garden/aKP04nPJ-0H0X3HE/1000333965-removebg-preview.png" alt="Spectra Logo"></div>
            <div class="spectra-tab active" data-tab="main">${icons.main}<span>Main</span></div>
            <div class="spectra-tab" data-tab="visuals">${icons.visuals}<span>Visuals</span></div>
            <div class="spectra-tab" data-tab="experimental">${icons.experimental}<span>Experimental</span></div>
            <div class="spectra-tab" data-tab="settings">${icons.settings}<span>Settings</span></div>
        </div>
        <div id="spectra-content">
            <div class="spectra-category" data-tab-content="main">
                <div class="spectra-category-title">Main</div>
                <div class="spectra-toggle"><label>Killaura</label><input type="checkbox" id="hack-killaura"></div>
                <div class="spectra-toggle"><label>Killshot</label><input type="checkbox" id="hack-killshot"></div>
                <div class="spectra-toggle"><label>Spider</label><input type="checkbox" id="hack-spider"></div>
                <div class="spectra-toggle"><label>Jesus</label><input type="checkbox" id="hack-jesus"></div>
                <div class="spectra-toggle"><label>BHOP</label><input type="checkbox" id="hack-bhop"></div>
                <div class="spectra-toggle"><label>Scaffold</label><input type="checkbox" id="hack-scaffold"></div>
                <div class="spectra-toggle"><label>Walljump</label><input type="checkbox" id="hack-walljump"></div>
                <div class="spectra-toggle"><label>Waterjump</label><input type="checkbox" id="hack-waterjump"></div>
                <div class="spectra-toggle"><label>Noclip Move</label><input type="checkbox" id="hack-noclip-move"></div>
                <div class="spectra-toggle"><label>Kill Softly</label><input type="checkbox" id="hack-kill-softly"></div>
                <div class="spectra-toggle"><label>BHOP Knife</label><input type="checkbox" id="hack-bhop-knife"></div>
                <button class="spectra-button" id="hack-auto-sw">Auto SW</button>
                <button class="spectra-button" id="hack-noclip-place">Noclip Place</button>
                <button class="spectra-button" id="hack-high-jump">High Jump</button>
                <button class="spectra-button" id="hack-xp-duper">XP Duper</button>
            </div>
            <div class="spectra-category hidden" data-tab-content="visuals">
                <div class="spectra-category-title">Visuals</div>
                <div class="spectra-toggle"><label>ESP</label><input type="checkbox" id="hack-esp"></div>
                <div class="spectra-toggle"><label>Chest ESP</label><input type="checkbox" id="hack-chest-esp"></div>
                <div class="spectra-toggle"><label>Ore ESP</label><input type="checkbox" id="hack-ore-esp"></div>
                <div class="spectra-toggle"><label>Hitboxes</label><input type="checkbox" id="hack-hitboxes"></div>
                <div class="spectra-toggle"><label>Nametags</label><input type="checkbox" id="hack-nametags"></div>
                <div class="spectra-toggle"><label>Enemy Health</label><input type="checkbox" id="hack-enemy-health"></div>
                <div class="spectra-toggle"><label>Night</label><input type="checkbox" id="hack-night"></div>
                <div class="spectra-toggle"><label>Bigheads</label><input type="checkbox" id="hack-bigheads"></div>
            </div>
            <div class="spectra-category hidden" data-tab-content="experimental">
                <div class="spectra-category-title">Experimental</div>
                <div class="spectra-toggle"><label>Blink</label><input type="checkbox" id="hack-blink"></div>
                <div class="spectra-toggle"><label>Pickup Reach</label><input type="checkbox" id="hack-pickup-reach"></div>
                <div class="spectra-toggle"><label>Anti-Spike</label><input type="checkbox" id="hack-anti-spike"></div>
                <button class="spectra-button" id="hack-spawn-teleport">/spawn Teleport</button>
                <button class="spectra-button" id="hack-anti-web">Anti-Web</button>
            </div>
            <div class="spectra-category hidden" data-tab-content="settings">
                <div class="spectra-category-title">Settings</div>
                <div class="spectra-toggle"><label>Anti-Ban (Safer)</label><input type="checkbox" id="hack-anti-ban"></div>
                <div class="spectra-toggle"><label>Inventory Cleaner</label><input type="checkbox" id="hack-inv-cleaner"></div>
                <div class="spectra-setting"><label>Primary Color</label><input type="color" id="theme-primary-color" value="#D30000"></div>
                <div class="spectra-setting"><label>Secondary Color</label><input type="color" id="theme-secondary-color" value="#3e0000"></div>
                <div class="spectra-setting"><label>Font</label><select id="theme-font-select"><option value='"Segoe UI", sans-serif'>Segoe UI</option><option value="Arial, sans-serif">Arial</option><option value="Verdana, sans-serif">Verdana</option><option value="Georgia, serif">Georgia</option><option value="'Courier New', monospace">Courier New</option></select></div>
                <button class="spectra-button" id="theme-reset">Reset Theme</button>
                <button class="spectra-button" id="hack-ranks">Spoof Ranks</button>
                <button class="spectra-button" id="hack-player-coords">Show Player Coords</button>
                <button class="spectra-button" id="hack-purge-cookies">Purge Cookies & Reload</button>
                <button class="spectra-button" id="hack-discord">Discord</button>
                <button class="spectra-button" id="hack-unban">Attempt Unban (Reload)</button>
                <button class="spectra-button" id="hack-manual-inject">Manual Inject</button>
            </div>
        </div>
    `;
    document.body.appendChild(ui);

    // ... all the UI setup and theme logic from spectra ...

    setupHackEventListeners();

})();
