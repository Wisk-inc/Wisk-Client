// ==UserScript==
// @name         Spectra Client (Hacks Extracted)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  All hacks from pottery009.txt with the Spectra Client UI
// @author       Jules
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //__START__HACK_CODE_FROM_POTTERY009_TXT______________________________________________

    let Fuxny = {};
    let defaultAccent = "#FF0000";

    const TITLE = "Midnight__" //-----------------------Title

    // Aimbot Configuration
    const MAX_TARGET_DISTANCE = 100;
    const AIM_SMOOTHNESS = 0.15;
    const TARGET_UPDATE_INTERVAL = 50;
    const NOTIFICATION_DURATION = 2000;

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
    let aimbotEnabled = false;
    let targetInterval = null;
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

    let everEnabled = {};

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
        //"LegLeftMesh",
        //"LegRightMesh",
        //"TorsoNode",
        //"ArmLeftMesh",
        //"ArmRightMesh",
        "BodyMesh",
        'Body|Armour',
        //"HeadMesh"
    ]; // Potential detection: If the player has leg armour there is no way leftLegMesh could have been hit.
    let killAuraEnabled = false
    let killAuraIntervalId = null
    let lastClosestId = null
    let newBox = null;
    let newBoxId = null;
    let __nullKey = null; //Entity enabled key
    let __stringKey = null; //Entity ID key "Then why didn't you just label them that?"
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

    let enemyHealthGuiEnabled = false;
    let healthWatcherInterval = null;
    let lastPercent = null;
    let lastChangeTime = Date.now();
    let resetTimeout = null;


    let eIdKey = null;
    let targetEntity = null;
    let targetEntityDistance = null;


    let pickupReachEnabled = false; //Credits to wang!!!!
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

    // ETC
    let playerKey = null;
    let moveState = null;
    let physState = null;
    let humanoidMeshlist = null;
    let playerEntity = null;
    let skyboxEntity = null;
    let skyboxMesh = null;
    let bigHeadsInterval = null;
    let scaffoldIntervalId = null;
    let targetFinderId = null;
    let setHealthBar = null;
    let playerInventoryParent = null;


    // Variables and helper functions outside the object
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


    function calculateAngle(from, to) {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const dz = to[2] - from[2];
        const yaw = Math.atan2(dx, dz);
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        const pitch = -Math.atan2(dy, horizontalDistance);
        return { yaw, pitch };
    }

    function lerpAngle(current, target, factor) {
        let diff = target - current;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        return current + diff * factor;
    }

    function findAndAimAtTarget() {
        if (!gameObjects.entities || !gameObjects.impKey || !gameObjects.camera) return;
        try {
            if (!gameObjects.entities.getState(1, "genericLifeformState")?.isAlive) return;
            const myPos = gameObjects.entities.getState(myId, 'position')?.position;
            if (!myPos) return;
            const rendering = r.values(gameObjects.rendering)[18];
            const objectData = rendering?.objectData;
            if (!objectData || !eIdKey) return;
            let closestId = null;
            let minDist = MAX_TARGET_DISTANCE * MAX_TARGET_DISTANCE;
            let targetPos = null;
            for (const key in objectData) {
                const obj = objectData[key];
                const eId = obj[eIdKey];
                if (eId == null || obj.type !== "Player" || obj.pickable === false || eId === myId || !gameObjects.entities.getState(eId, "genericLifeformState") || !gameObjects.entities.getState(eId, "genericLifeformState").isAlive) continue;
                const state = gameObjects.entities.getState(eId, "genericLifeformState");
                if (!state || !state.isAlive) continue;
                const ent = r.values(gameObjects.entityList)?.[1]?.[eId];
                if (!ent || ent.canAttack !== true) continue;
                const pos = gameObjects.entities.getState(eId, 'position')?.position;
                if (!pos) continue;
                const dx = pos[0] - myPos[0];
                const dy = pos[1] - myPos[1];
                const dz = pos[2] - myPos[2];
                if (Math.abs(dy) > 5) continue;
                const distSquared = dx * dx + dy * dy + dz * dz;
                if (distSquared < minDist) {
                    minDist = distSquared;
                    closestId = eId;
                    targetPos = pos;
                }
            }
            if (closestId !== lastClosestId) {
                lastClosestId = closestId;
                if (closestId) {
                    targetEntityDistance = Math.floor(Math.sqrt(minDist));
                    showTemporaryNotification(`🎯 Targeting player ${closestId} (${targetEntityDistance}m)`);
                } else {
                    targetEntityDistance = null;
                }
            }
            if (closestId && targetPos && gameObjects.camera) {
                const aimPos = [targetPos[0], targetPos[1] + 1.6, targetPos[2]];
                const targetAngles = calculateAngle(myPos, aimPos);
                let currentYaw = gameObjects.camera.heading;
                let currentPitch = gameObjects.camera.pitch;
                if (currentYaw !== undefined && currentPitch !== undefined) {
                    const newYaw = lerpAngle(currentYaw, targetAngles.yaw, AIM_SMOOTHNESS);
                    const newPitch = lerpAngle(currentPitch, targetAngles.pitch, AIM_SMOOTHNESS);
                    try {
                        gameObjects.camera.heading = newYaw;
                        gameObjects.camera.pitch = newPitch;
                    } catch (cameraError) {
                        console.warn("[Aimbot] Camera control error:", cameraError);
                    }
                } else {
                    console.warn("[Aimbot] Could not access camera angles");
                }
            }
        } catch (error) {
            console.error("[Aimbot] Error in findAndAimAtTarget:", error);
        }
    }

    function enableAimbot() {
        if (!injectedBool) {
            showTemporaryNotification("❌ Game not properly injected");
            return false;
        }
        aimbotEnabled = true;
        targetInterval = setInterval(findAndAimAtTarget, TARGET_UPDATE_INTERVAL);
        showTemporaryNotification("🎯 Aimbot ENABLED");
        return true;
    }

    function disableAimbot() {
        aimbotEnabled = false;
        if (targetInterval) {
            clearInterval(targetInterval);
            targetInterval = null;
        }
        lastClosestId = null;
        targetEntityDistance = null;
        showTemporaryNotification("❌ Aimbot DISABLED");
        return true;
    }

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


    function showTemporaryNotification(message, duration = 1500) {
        const defaultBackGroundColor = 'rgba(0, 0, 0, 0.5)'; // semi-transparent black
        const defaultBackGroundBlur = 9;
        const defaultAccent = "#FF0000"; // HEX accent color

        // Create a notification container if it doesn't exist
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

        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;

        // Style the notification
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

        // Border using accent color
        notification.style.border = `2px solid ${defaultAccent}`;

        // Optional: give it a slight gradient inner glow (if you want it fancier)
        // notification.style.boxShadow = `0 0 12px ${defaultAccent}, 0 4px 8px rgba(0,0,0,0.2)`;

        // Add to container
        notificationContainer.appendChild(notification);

        // Trigger the fade-in effect
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Set up the fade-out and removal
        setTimeout(() => {
            notification.style.opacity = '0';
            // No translateY(-20px) because you disliked that

            setTimeout(() => {
                notification.remove();
                if (notificationContainer.children.length === 0) {
                    notificationContainer.remove();
                }
            }, 500);
        }, duration);
    }

    function clearESPBoxes() {
        for (const key in chestBoxes) {
            for (const {
                    mesh,
                    id
                } of chestBoxes[key]) {
                mesh.dispose();
                Fuxny.entities.deleteEntity(id);
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

            const mesh = Fuxny.Lion.Mesh.CreateBox("espbox", 0.5, false, 1, Fuxny.Lion.scene);
            mesh.position.set(worldX, worldY, worldZ);
            mesh.renderingGroupId = 1;

            mesh.material = new Fuxny.Lion.StandardMaterial("mat", Fuxny.Lion.scene)

            const id = Fuxny.entities.add([worldX, worldY, worldZ], null, null, mesh);
            if (!chestBoxes[chunkKey]) chestBoxes[chunkKey] = [];
            chestBoxes[chunkKey].push({
                mesh,
                id
            });


            if ([204, 205, 206, 207].includes(blockID)) {
                console.log("FOUNDCHEST")

                mesh.material.diffuseColor = new Fuxny.Lion.Color3(1, 0.5, 0); // orange
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(1, 0.5, 0); // makes it glow orange
            }
            if (blockID === 45) {
                mesh.material.diffuseColor = new Fuxny.Lion.Color3(0, 0, 1); // blue
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(0, 0, 1); // makes it glow blue
            }

            if (blockID === 465) {
                mesh.material.diffuseColor = new Fuxny.Lion.Color3(0.7, 0.5, 1); // pale purple
                mesh.material.emissiveColor = new Fuxny.Lion.Color3(0.7, 0.5, 1); // makes it glow pale purple
            }




        }
    }

    function scanAllChunks() {
        if (!Fuxny?.world || !Fuxny?.world?.[Fuxny.impKey]?.hash) return;
        const chunkHash = Fuxny.world[Fuxny.impKey].hash;
        // Step 1: Remove boxes for chunks no longer loaded
        for (const scannedKey of scannedChunks) {
            if (!(scannedKey in chestBoxes)) continue;

            if (!Object.values(chunkHash).some(chunk => getChunkKey(chunk) === scannedKey)) {
                // Delete all meshes for this chunk
                for (const {
                        mesh,
                        id
                    } of chestBoxes[scannedKey]) {
                    mesh.dispose(); // remove from scene
                    Fuxny.entities.deleteEntity(id); // remove from entity system if needed
                }
                delete chestBoxes[scannedKey];
                scannedChunks.delete(scannedKey);
            }
        }

        // Step 2: Scan newly loaded chunks
        for (const chunkKey in chunkHash) {

            const chunk = chunkHash[chunkKey];
            if (!chunkDataField) {
                autoDetectChunkDataField(chunk);
                if (!chunkDataField) continue; // Skip if still not found
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

    function stopMoving() {
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
    }

    function startMoving() {
        if (moveInterval) return; // Already moving

        moveInterval = setInterval(() => {
            let pos = Fuxny.entities.getState(1, 'position').position;
            let h = Fuxny.camera.heading;
            let p = Fuxny.camera.pitch;

            let newX = pos[0];
            let newY = pos[1];
            let newZ = pos[2];

            const now = Date.now();

            if (p < -1) {
                // Looking up: move up only if 500ms have passed
                if (now - lastUpTime >= 500) {
                    newY += distance + 0.9;
                    lastUpTime = now;
                }
            } else if (p > 1) {
                // Looking down: move down
                newY -= distance;
            } else {
                // Move forward horizontally
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

    function searchForTerm(obj, term) {
        const results = [];
        const visited = new WeakSet();

        function recurse(current, path = []) {
            if (typeof current !== 'object' || current === null) return;

            if (visited.has(current)) return;
            visited.add(current);

            for (const key in current) {
                if (!Object.hasOwn(current, key)) continue;

                const value = current[key];
                const keyMatch = key.toLowerCase().includes(term.toLowerCase());
                const valMatch = (
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean'
                ) && String(value).toLowerCase().includes(term.toLowerCase());

                if (keyMatch || valMatch) {
                    results.push({
                        path: [...path, key].join('.'),
                        key: key,
                        value: value
                    });
                }

                if (typeof value === 'object' && value !== null) {
                    recurse(value, [...path, key]);
                }
            }
        }

        recurse(obj);
        return results;
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

    const toggleBlink = (interval = 0, noPacket = false) => {
        blinkState.enabled = !blinkState.enabled;
        blinkState.interval = interval;
        blinkState.noPacket = noPacket;

        if (blinkState.enabled) {
            console.log(`[Blink] ENABLED — interval: ${interval}, noPacket: ${noPacket}`);

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
            console.log(`[Blink] DISABLED — sending ${blinkState.queued.length} packets.`);

            for (const [J, T] of blinkState.queued) {
                blinkState.originalSendBytes.call(colyRoom, J, T);
            }

            colyRoom[sendBytesName] = blinkState.originalSendBytes;
            blinkState.queued = [];
        }
    };

    function wangPlace(position) {

        let heldBlock = r.values(Fuxny.noa.entities[Fuxny.impKey])[22].list[0]._blockItem;
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

        // Convert to block coordinates by flooring each component
        const blockX = Math.floor(position[0]);
        const blockY = Math.floor(position[1]);
        const blockZ = Math.floor(position[2]);
        if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 3, blockZ]) || r.values(Fuxny.world)[47].call(Fuxny.world, blockX, blockY - 3, blockZ) === 0) {
            wangPlace([blockX, blockY - 3, blockZ])
        }
        if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 2, blockZ]) || r.values(Fuxny.world)[47].call(Fuxny.world, blockX, blockY - 2, blockZ) === 0) {
            wangPlace([blockX, blockY - 2, blockZ])
        }
        if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY - 1, blockZ]) || r.values(Fuxny.world)[47].call(Fuxny.world, blockX, blockY - 1, blockZ) === 0) {
            wangPlace([blockX, blockY - 1, blockZ])
        }
        if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY, blockZ]) || r.values(Fuxny.world)[47].call(Fuxny.world, blockX, blockY, blockZ) === 0) {
            wangPlace([blockX, blockY, blockZ])
        }

    }

    function placeSpike(position) {

        // Convert to block coordinates by flooring each component
        const blockX = Math.floor(position[0]);
        const blockY = Math.floor(position[1]);
        const blockZ = Math.floor(position[2]);
        if (playerEntity.checkTargetedBlockCanBePlacedOver([blockX, blockY + 1, blockZ]) || r.values(Fuxny.world)[47].call(Fuxny.world, blockX, blockY + 1, blockZ) === 0) {
            wangPlace([blockX, blockY + 1, blockZ])
        }
    }

    function moveItem(itemName, desiredSlot) {
        if (!playerInventoryParent || !playerInventoryParent.playerInventory?.items) {
            console.warn("❌ playerInventoryParent is not set. Run findAndSavePlayerInventoryParent() first.");
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
            console.warn(`❌ No ${itemName} found in slot 10 or higher.`);
            return false;
        }
        console.log(`🔁 Swapping ${itemName} from slot ${oldSlot} with slot ${desiredSlot}`);
        playerInventoryParent.swapPosClient(oldSlot, desiredSlot, null);
        return true;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function bunnyHop() {
        if (!physState.isOnGround?.() || moveState.crouching || moveState.speed < 0.05) return;
        moveState.jumping = true;
        physState._hadJumpInputPrevTick = false;
        setTimeout(() => {
            moveState.jumping = false;
        }, 20);
    }

    function waitForElement(selector, callback) {
        if (alreadyConnected) {
            injectButton.disabled = false;
            injectButton.textContent = "Click if game loaded."
            startWebSocketWatcher();
            return;
        }
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.matches(selector)) {
                        observer.disconnect();
                        callback(node);
                        return;
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async function autoSW() {
        if (lastClosestId && targetEntityDistance <= 36) { // place web then spikes

            if (moveItem("net", webSlot) || moveItem("web", webSlot)) {
                let enemyPos = Fuxny.entities.getState(lastClosestId, 'position').position;

                Fuxny.noa.inputs.down['_events'][`HotBarSlot${webSlot + 1}`]();

                placeToPlayer(enemyPos);

                await sleep(50); // delay before switching to spikes

                if (moveItem("spikes", spikeSlot)) {
                    Fuxny.noa.inputs.down['_events'][`HotBarSlot${spikeSlot + 1}`]();
                    placeSpike(enemyPos);
                }
            } else { // just place spikes
                if (moveItem("spikes", spikeSlot)) {
                    Fuxny.noa.inputs.down['_events'][`HotBarSlot${spikeSlot + 1}`]();
                    await sleep(50);

                    let enemyPos = Fuxny.entities.getState(lastClosestId, 'position').position;
                    placeToPlayer(enemyPos);
                } else {
                    console.log("no spikes or webs!");
                }
            }
            Fuxny.noa.inputs.down['_events'].HotBarSlot1();
        } else {
            console.log("No target or too far");
        }
        if (!everEnabled.autoSWUsed) {
            everEnabled.autoSWUsed = true
        };
    }

    function makeHitboxes() {
        if (!injectedBool) {
            console.log("NOT INJECTED NO TARGET");
            return;
        }

        const rendering = r.values(Fuxny.rendering)[18];
        const objectData = rendering?.objectData;
        if (!objectData || !eIdKey) return;

        const activeEIds = new Set();

        // First, build a set of currently valid entity IDs
        for (const key in objectData) {
            if (key === "1") continue;
            const obj = objectData[key];
            const eId = obj[eIdKey];

            if (
                eId == null ||
                eId === myId ||
                obj.pickable === false ||
                obj.type !== "Player" ||
                !Fuxny.entities.getState(eId, "genericLifeformState")
            ) continue;

            activeEIds.add(eId);

            // If hitbox already exists, skip
            if (hitboxes[eId]) continue;

            // Create the hitbox
            let newBox_00 = Fuxny.Lion.Mesh.CreateBox("mesh", 1, false, 1, Fuxny.Lion.scene);
            newBox_00.renderingGroupId = 2;

            newBox_00.material = new Fuxny.Lion.StandardMaterial("mat", Fuxny.Lion.scene);
            newBox_00.material.diffuseColor = new Fuxny.Lion.Color3(1, 1, 1);
            newBox_00.material.emissiveColor = new Fuxny.Lion.Color3(1, 1, 1);
            newBox_00.name = '_';
            newBox_00.id = '__' + eId;

            let defaultPosition = new newBox_00.position.constructor(0, 0.32, 0);
            newBox_00.position = defaultPosition.clone();
            newBox_00._scaling._y = 2.2;
            newBox_00.material.alpha = 0.5;
            newBox_00.isVisible = hitBoxEnabled;

            rendering.attachTransformNode(newBox_00, key, 13);
            r.values(Fuxny.rendering)[27].call(Fuxny.rendering, newBox_00);

            Object.defineProperty(newBox_00._nodeDataStorage, '_isEnabled', {
                get: () => true,
                set: (v) => {},
                configurable: false
            });

            hitboxes[eId] = newBox_00;
        }

        // Cleanup hitboxes of players no longer present
        for (const eId in hitboxes) {
            if (!activeEIds.has(eId)) {
                hitboxes[eId]?.dispose();
                delete hitboxes[eId];
            }
        }

        // Visibility toggle based on node[0].enabled and hitBoxEnabled
        for (const key in objectData) {
            const obj = objectData[key];
            const eId = obj?.[eIdKey];
            if (!eId || !hitboxes[eId]) continue;

            const baseNode = obj.nodes?.[0];
            if (!baseNode) continue;

            hitboxes[eId].isVisible = baseNode.enabled && hitBoxEnabled;
        }
    }

    function startHealthWatcher() {
        everEnabled.enemyHealthGuiEnabled = true;
        if (healthWatcherInterval) clearInterval(healthWatcherInterval);

        healthWatcherInterval = setInterval(() => {
            const list = Fuxny.entities[Fuxny.impKey].entityName.list;
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

            // Hide health bar if not found, or at full/near full
            if (!foundTarget || percent === 0 || percent >= 1) { // ) {
                if (resetTimeout) {
                    clearTimeout(resetTimeout)
                };
                setHealthBar(100, false);
                lastPercent = null;
                return;
            }

            // Update bar only if changed
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

    (() => {
        // Remove if already present
        const old = document.getElementById("vertical-health-bar");
        if (old) old.remove();

        // Create bar container
        const container = document.createElement("div");
        container.id = "vertical-health-bar";
        Object.assign(container.style, {
            position: "fixed",
            left: "calc(50% - 200px)", // 100px left of center
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

        // Create fill element
        const fill = document.createElement("div");
        Object.assign(fill.style, {
            width: "100%",
            height: "100%",
            background: "limegreen",
            transform: "scaleY(1)",
            transformOrigin: "bottom",
            transition: "transform 0.2s ease, background 0.2s ease", // <-- add comma here
        });

        container.appendChild(fill);
        document.body.appendChild(container);

        // Function to compute smooth gradient color from green → red
        function getHealthColor(health) {
            const ratio = health / 100;

            if (ratio > 0.5) {
                // Bright green → orange
                const t = (ratio - 0.5) * 2;
                const r = Math.round(255 * (1 - t));
                const g = 255;
                return `rgb(${r}, ${g}, 0)`; // green to yellow to orange
            } else {
                // Orange → red
                const t = ratio * 2;
                const r = 255;
                const g = Math.round(255 * t);
                return `rgb(${r}, ${g}, 0)`; // orange to red
            }
        }


        // Global health setter and show/hide toggle
        setHealthBar = function(health, show = true) {
            const clamped = Math.max(0, Math.min(health, 100));
            fill.style.transform = `scaleY(${clamped / 100})`;
            fill.style.background = getHealthColor(clamped);
            container.style.display = show ? "flex" : "none";
        };
        setHealthBar(100, false)
    })();


    function performInjection() {
        l.init();
        function inject() {
            let winDescriptors = Object.getOwnPropertyDescriptors(window);
            let wpName = Object.keys(winDescriptors).find(key => winDescriptors[key]?.set?.toString().includes("++"));
            let wpInstance = window[wpName] = window[wpName];

            // HILOCATOR push
            wpInstance.push([
                [Math.floor(Math.random() * 90000) + 10000], {},
                function(wpRequire) {
                    Fuxny.findModule = (code) => wpRequire(Object.keys(wpRequire.m)[Object.values(wpRequire.m).findIndex(m => m.toString().includes(code))]);
                    Fuxny.Props = Object.values(Fuxny.findModule("nonBlocksClient:")).find(prop => typeof prop == "object");
                    Fuxny.noa = Object.values(Fuxny.Props).find(prop => prop?.entities);
                    //Credits to, you guessed it wang!
                }
            ]);


            const targetValue = r.values(Fuxny.noa.entities)[2];
            const entityEntries = Object.entries(Fuxny.noa.entities);
            Fuxny.impKey = entityEntries.find(([_, val]) => val === targetValue)?.[0];
            Fuxny.registry = r.values(Fuxny.noa)[17]
            Fuxny.rendering = r.values(Fuxny.noa)[12]
            Fuxny.entities = Fuxny.noa.entities;


            Fuxny.ECS = r.values(Fuxny.noa)[19]

            if (Fuxny.impKey) {
                console.log("importantList identified:", Fuxny.impKey);

                // Attempt to find BHOP references
                const key = Fuxny.impKey;
                if (key) {
                    const entity = Fuxny.noa.entities?.[key];
                    if (entity?.moveState?.list?.[0] && entity?.movement?.list?.[0]) {
                        playerKey = key;
                        moveState = entity.moveState.list[0];
                        physState = entity.movement.list[0];
                        cachedBHOPParent = entity;
                        console.log("✅ Cached BHOP entity data");
                    } else {
                        console.warn("⚠️ Found key but missing BHOP components");
                    }
                } else {
                    console.warn("❌ BHOP player key not found");
                }
            }

            function findeIdKey() {

                const rendering = r.values(Fuxny.rendering)[18];
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

            let mesh = r.values(Fuxny.rendering)[7].meshes[0];
            let scene = r.values(Fuxny.rendering)[7];
            let engine = scene.getEngine();
            let StandardMaterial = mesh.material.constructor;
            let Color3 = mesh.material.diffuseColor.constructor;
            let sceneLoaderMod = Fuxny.findModule("getEngine().displayLoadingUI()");
            const addKey = r.values(Fuxny.entities)[10]
            const addComponent = Fuxny.noa.entities[addKey];
            Fuxny.world = r.values(Fuxny.noa)[11]
            Fuxny.physics = Fuxny.noa.physics
            Fuxny.camera = Fuxny.noa.camera
            Fuxny.bloxd = Fuxny.noa.bloxd
            Fuxny.clientOptions = r.values(Fuxny.noa)[29]
            Fuxny.Lion = {
                scene,
                engine,
                InstancedMesh: mesh.constructor,
                Mesh: mesh.constructor,
                Scene: scene.constructor,
                Engine: engine.constructor,
                sceneLoader: Object.values(sceneLoaderMod).find(mod => typeof mod.ImportMesh === "function"),
                Color3,
                StandardMaterial,
                addComponent,
                addKey
            };
            playerInventoryParent = Fuxny.entities[Fuxny.impKey].inventory.list[0].opWrapper

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
                            ArrayBuffer.isView(val.data) // covers Uint16Array etc.
                        )
                    ) {
                        console.log("✅ Detected chunk data field:", key);
                        chunkDataField = key;
                        return key;
                    }
                }

                console.warn("❌ Failed to auto-detect chunk data field");
                return null;
            }

            autoDetectChunkDataField(Object.values(Fuxny.world[Fuxny.impKey].hash)[0]);


            const maybeEntity = r.values(r.values(Fuxny.entities[Fuxny.impKey])[22].list[0])[1];

            const hasDoAttackDirect = typeof maybeEntity?.doAttack === 'function';
            const hasDoAttackBreakingItem = typeof maybeEntity?.breakingItem?.doAttack === 'function';

            if (hasDoAttackDirect) {
                console.log("maybeEntity has doAttack");
                playerEntity = maybeEntity;
            } else if (hasDoAttackBreakingItem) {
                console.log("maybeEntity.breakingItem has doAttack");
                playerEntity = maybeEntity.breakingItem;
            } else {
                console.warn("Neither maybeEntity nor its breakingItem has doAttack");
                playerEntity = null;
            }

            function findOnlysendBytes(obj) {
                if (!obj) {
                    console.warn("❌ Provided object is null or undefined.");
                    return null;
                }

                const proto = Object.getPrototypeOf(obj);
                const props = Object.getOwnPropertyNames(proto);

                for (const key of props) {
                    if (key === 'constructor') continue;

                    const val = proto[key];
                    if (typeof val === 'function') {
                        const str = val.toString();

                        // Looser but effective pattern detection
                        const looksLikesendBytes =
                            val.length === 2 &&
                            /Protocol\.ROOM_DATA_BYTES/i.test(str) &&
                            str.includes('Uint8Array') &&
                            /typeof/.test(str) && // just check any typeof usage
                            str.includes('.encode') &&
                            (str.includes('.byteLength') || str.includes('.length')) &&
                            str.includes('.set');

                        if (looksLikesendBytes) {
                            console.log(`✅ Real sendBytes found: ${key}`);
                            return key;
                        }
                    }
                }

                console.warn("❌ sendBytes function not found.");
                return null;
            }

            // Usage
            colyRoom = r.values(Fuxny.bloxd.client.msgHandler)[0];
            sendBytesName = findOnlysendBytes(colyRoom);

            if (!colyRoom || typeof colyRoom[sendBytesName] !== "function") {
                console.warn("[Blink] colyRoom or sendBytes not ready.");
            }

            blinkState = {
                enabled: false,
                originalSendBytes: colyRoom[sendBytesName],
                queued: [],
                interval: 0,
                noPacket: false
            };




            cachedNameTagParent = Fuxny.Lion.scene

            // --- Aimbot Injection Logic ---
            gameObjects.noa = Fuxny.noa;
            gameObjects.entities = Fuxny.entities;
            gameObjects.rendering = Fuxny.rendering;
            gameObjects.camera = Fuxny.camera;
            gameObjects.entityList = r.values(Fuxny.noa)[30];
            const aimbot_targetValue = r.values(Fuxny.entities)[2];
            const aimbot_entityEntries = Object.entries(Fuxny.entities);
            gameObjects.impKey = aimbot_entityEntries.find(([_, val]) => val === aimbot_targetValue)?.[0];
            if (!eIdKey) { // eIdKey is already found by Fuxny's injection, but as a fallback:
                 const rendering = r.values(Fuxny.rendering)[18];
                 const objectData = rendering?.objectData;
                 if (objectData) {
                    for (const key in objectData) {
                        const obj = objectData[key];
                        if (obj && typeof obj === 'object') {
                            for (const prop in obj) {
                                if (typeof obj[prop] === 'number' && obj[prop] > 0 && obj[prop] < 1000) {
                                    eIdKey = prop;
                                    break;
                                }
                            }
                            if (eIdKey) break;
                        }
                    }
                }
            }
            // --- End Aimbot Injection ---

            injectedBool = true;
        }

        function setupKillAuraBox() {


            newBox = Fuxny.Lion.Mesh.CreateBox("mesh", 1, false, 1, Fuxny.Lion.scene);
            newBox.renderingGroupId = 1;
            newBoxId = Fuxny.entities.add([0, 10, 0], null, null, newBox);

            //newBox.Da = true;
            newBox.material = new Fuxny.Lion.StandardMaterial("mat", Fuxny.Lion.scene);
            newBox.material.diffuseColor = new Fuxny.Lion.Color3(1, 1, 1);
            newBox.material.emissiveColor = new Fuxny.Lion.Color3(1, 1, 1);
            newBox.name = 'BodyMesh';
            newBox.id = 'BodyMesh';
            newBox.isVisible = false;

            // Find null key
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

            Fuxny.entityList = r.values(Fuxny.noa)[30]

            humanoidMeshlist = Fuxny.entities[Fuxny.impKey]?.humanoidMesh?.list;
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
            } else {
                console.error("❌ Invalid humanoidMeshlist path.");
            }

            // Follow loop
            function followHeadLoop() {
                if (newBox) {
                    const playerId = 1;
                    const playerPosState = Fuxny.entities.getState(playerId, "position");

                    if (playerPosState && Array.isArray(playerPosState.position)) {
                        const [x, y, z] = playerPosState.position;
                        const newPos = [x, y + 1.5, z];
                        Fuxny.entities.setPosition(newBoxId, newPos);
                    } else {
                        console.error("Player position not found or invalid");
                    }
                }

                animationFrameId = requestAnimationFrame(followHeadLoop);
            }

            // Start the loop
            animationFrameId = requestAnimationFrame(followHeadLoop);
        }

        function startTargetFinder() {
            let armourNodeNum = r.values(Fuxny.rendering)[18].getNamedNode(1, "Body|Armour")
            let closestObj = null;
            targetFinderId = setInterval(() => {
                if (!injectedBool) {

                    console.log("NOT INJECTED NO TARGET")
                }

                if (!Fuxny.entities.getState(1, "genericLifeformState").isAlive) return;

                const myPos = Fuxny.entities.getState?.(myId, 'position')?.position;
                if (!myPos) return;

                const rendering = r.values(Fuxny.rendering)[18];
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
                        !Fuxny.entities.getState(eId, "genericLifeformState") ||
                        !Fuxny.entities.getState(eId, "genericLifeformState").isAlive
                    ) continue;


                    if (!eId || eId === myId || obj.pickable === false || obj.type !== "Player") continue;

                    const state = Fuxny.entities.getState(eId, "genericLifeformState");
                    if (!state || !state.isAlive) continue;

                    const ent = r.values(Fuxny.entityList)?.[1]?.[eId];
                    if (!ent || ent.canAttack !== true) continue;

                    const pos = Fuxny.entities.getState(eId, 'position')?.position;
                    if (!pos) continue;

                    const dx = pos[0] - myPos[0];
                    const dy = pos[1] - myPos[1];
                    const dz = pos[2] - myPos[2];

                    if (Math.abs(dy) > 3) continue; // optional Y-axis restriction

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
                    if (!newBox.metadata) newBox.metadata = {};
                    newBox.metadata.eId = closestId;
                    //console.log(newBox.id,"  ",closestId)
                    if (closestId !== lastClosestId) {
                        if (hitboxes[closestId]) {
                            hitboxes[closestId].material.diffuseColor = new Fuxny.Lion.Color3(1, 0, 0);
                            hitboxes[closestId].material.emissiveColor = new Fuxny.Lion.Color3(1, 0, 0);
                            for (const id in hitboxes) {
                                if (id !== closestId && hitboxes[id]) {
                                    hitboxes[id].material.diffuseColor = new Fuxny.Lion.Color3(1, 1, 1);
                                    hitboxes[id].material.emissiveColor = new Fuxny.Lion.Color3(1, 1, 1);
                                }
                            }
                        }

                        lastClosestId = closestId;
                    }
                } else {
                    lastClosestId = null;
                }

                // Final visibility and distance logic
                if (killAuraEnabled && closestId != null && minDist < 16) { //16 for now
                    newBox[__nullKey] = true;
                    targetEntityDistance = Math.floor(Math.sqrt(minDist));
                } else {
                    newBox[__nullKey] = false;
                    targetEntityDistance = null;
                }


            }, 100);
        }
        inject();
        setupKillAuraBox();
        startTargetFinder();
        setInterval(makeHitboxes, 1000);
    }

    waitForElement('div.MainLoadingState.FullyFancyText', (el) => {
        console.log('Target div appeared:', el);
        performInjection();
        if (!injectedBool) {
            showTemporaryNotification("injection failed");
        } else {
            showTemporaryNotification("injection successful");
        }
    });

    //__END__HACK_CODE_FROM_POTTERY009_TXT________________________________________________


    // --- ICONS (Lucide style SVGs) ---
    const icons = {
        main: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>`,
        visuals: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/></svg>`,
        experimental: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
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
            height: 320px;
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
            /* Removed the box-shadow for the logo */
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
        .spectra-button {
            background: rgba(255,255,255,0.04);
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
            font-size: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer;
            text-align: center;
            width: 100%;
        }
        .spectra-button:hover {
            background: rgba(255,255,255,0.08);
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
            <div class="spectra-tab" data-tab="experimental">${icons.experimental}<span>Experimental</span></div>
            <div class="spectra-tab" data-tab="settings">${icons.settings}<span>Settings</span></div>
        </div>
        <div id="spectra-content">
            <div class="spectra-category" data-tab-content="main">
                <div class="spectra-category-title">Main</div>
                <div class="spectra-toggle"><label>Aimbot</label><input type="checkbox" id="hack-aimbot"></div>
                <div class="spectra-toggle"><label>Killaura</label><input type="checkbox" id="hack-killaura"></div>
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
                <button class="spectra-button" id="hack-health-color">Set Health Color</button>
                <button class="spectra-button" id="hack-ranks">Spoof Ranks</button>
                <button class="spectra-button" id="hack-player-coords">Show Player Coords</button>
                <button class="spectra-button" id="hack-purge-cookies">Purge Cookies & Reload</button>
                <button class="spectra-button" id="hack-discord">Discord</button>
                <button class="spectra-button" id="hack-unban">Attempt Unban (Reload)</button>
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

    // --- NEW HACK MODULES ---
    class Module {
        constructor(name) { this.name = name; this.isEnabled = false; }
        onEnable() {}
        onDisable() {}
        enable() { this.isEnabled = true; this.onEnable(); }
        disable() { this.isEnabled = false; this.onDisable(); }
        toggle() { this.isEnabled ? this.disable() : this.enable(); }
    }

    class AntiSpike extends Module {
        constructor() { super("AntiSpike"); }
        onEnable() {
            let items = r.values(r.values(l.findModule("Gun:class")).find(o => typeof o == "object"));
            let registryKey = r.keys(n.noa.registry)[12];
            items.filter(o => o.name.includes("Spikes")).forEach(o => { n.noa.registry[registryKey][o.id] = true; });
        }
        onDisable() {
            let items = r.values(r.values(l.findModule("Gun:class")).find(o => typeof o == "object"));
            let registryKey = r.keys(n.noa.registry)[12];
            items.filter(o => o.name.includes("Spikes")).forEach(o => { n.noa.registry[registryKey][o.id] = false; });
        }
    }

    class Spider extends Module {
        constructor() { super("Spider"); }
        onRender() {
            if (l.noa.inputs.state.jump && n.noa.touchingWall()) {
                n.noa.setVelocity(null, 5, null);
            }
        }
    }

    class Killaura extends Module {
        constructor() {
            super("Killaura");
            this.lastExecutionTime = 0;
            this.delay = 100;
        }
        onRender() {
            let now = Date.now();
            if (now - this.lastExecutionTime >= this.delay) {
                this.lastExecutionTime = now;
                this.tryKill();
            }
        }
        tryKill() {
            let myPos = n.noa.getPosition(1);
            n.noa.playerList.forEach(playerId => {
                let enemyPos = n.noa.getPosition(playerId);
                if (enemyPos && parseFloat(S.distanceBetweenSqrt(myPos, enemyPos)) <= 7) {
                    let vector = S.normalizeVector([enemyPos[0] - myPos[0], enemyPos[1] - myPos[1], enemyPos[2] - myPos[2]]);
                    n.noa.doAttack(vector, playerId.toString(), "BodyMesh");
                    n.noa.getHeldItem(1)?.trySwingBlock?.();
                    n.noa.getMoveState(1)?.setArmsAreSwinging?.();
                }
            });
        }
    }

    class Jesus extends Module {
        constructor() { super("Jesus"); }
        onEnable() {
            let items = r.values(r.values(l.findModule("Gun:class")).find(o => typeof o == "object"));
            let registryKey = r.keys(n.noa.registry)[12];
            n.noa.registry[registryKey][items.find(o => o.name == "Water").id] = true;
            n.noa.registry[registryKey][items.find(o => o.name == "Lava").id] = true;
        }
        onDisable() {
            let items = r.values(r.values(l.findModule("Gun:class")).find(o => typeof o == "object"));
            let registryKey = r.keys(n.noa.registry)[12];
            n.noa.registry[registryKey][items.find(o => o.name == "Water").id] = false;
            n.noa.registry[registryKey][items.find(o => o.name == "Lava").id] = false;
        }
    }

    class Unban extends Module {
        constructor() { super("Unban"); }
        onEnable() {
            document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            location.reload();
        }
    }

    class HighJump extends Module {
        constructor() { super("HighJump"); }
        onEnable() {
            n.noa.setVelocity(null, 40, null);
        }
    }

    const newHacks = {
        antiSpike: new AntiSpike(),
        spider: new Spider(),
        killaura: new Killaura(),
        jesus: new Jesus(),
        unban: new Unban(),
        highJump: new HighJump()
    };

    // --- HACK LOGIC & WIRING ---
    function setupHackEventListeners() {
        // Helper function to ensure injection before activation
        const preCheck = (featureName, checkboxElement) => {
            if (!injectedBool) {
                showTemporaryNotification(`❌ Inject first to use ${featureName}!`);
                if (checkboxElement) checkboxElement.checked = false;
                return false;
            }
            return true;
        };

        // --- Abstraction for Toggles/Buttons ---
        const setupRenderToggle = (id, module) => {
            document.getElementById(id)?.addEventListener('change', e => {
                if (!preCheck(module.name, e.target)) return;
                module.isEnabled = e.target.checked;
                if (e.target.checked) {
                    if (module.onEnable) module.onEnable();
                    if (module.onRender && !modulesToRender.includes(module)) modulesToRender.push(module);
                } else {
                    if (module.onDisable) module.onDisable();
                    const index = modulesToRender.indexOf(module);
                    if (index > -1) modulesToRender.splice(index, 1);
                }
                showTemporaryNotification(`${module.name} ${module.isEnabled ? 'enabled' : 'disabled'}`);
            });
        };

        const setupSimpleToggle = (id, module) => {
            document.getElementById(id)?.addEventListener('change', e => {
                if (!preCheck(module.name, e.target)) return;
                module.toggle();
                showTemporaryNotification(`${module.name} ${module.isEnabled ? 'enabled' : 'disabled'}`);
            });
        };

        const setupButton = (id, module) => {
            document.getElementById(id)?.addEventListener('click', () => {
                if (!preCheck(module.name)) return;
                module.enable();
                showTemporaryNotification(`${module.name} triggered`);
            });
        };

        // --- Wire up New Hacks ---
        setupRenderToggle('hack-killaura', newHacks.killaura);
        setupRenderToggle('hack-spider', newHacks.spider);
        setupSimpleToggle('hack-jesus', newHacks.jesus);
        setupSimpleToggle('hack-anti-spike', newHacks.antiSpike);
        setupButton('hack-high-jump', newHacks.highJump);
        setupButton('hack-unban', newHacks.unban);

        // --- Wire up Old Hacks ---
        document.getElementById('hack-aimbot')?.addEventListener('change', e => {
            if (!preCheck("Aimbot", e.target)) return;
            if (e.target.checked) {
                enableAimbot();
            } else {
                disableAimbot();
            }
        });

        // Note: The old "Kill Aura" is replaced by the new one.
        document.getElementById('hack-bhop')?.addEventListener('change', e => {
            if (!preCheck("BHOP", e.target)) return;
            if (e.target.checked) {
                bhopIntervalId = setInterval(bunnyHop, 10);
                showTemporaryNotification("BHOP enabled");
            } else {
                clearInterval(bhopIntervalId);
                bhopIntervalId = null;
                showTemporaryNotification("BHOP disabled");
            }
        });

        document.getElementById('hack-scaffold')?.addEventListener('change', e => {
            if (!preCheck("Scaffold", e.target)) return;
            if (e.target.checked) {
                scaffoldIntervalId = setInterval(() => {
                    const pos = Fuxny.entities.getState(1, 'position').position;
                    if (!pos || !playerEntity || playerEntity.heldItemState.heldType !== "CubeBlock") return;
                    const exactX = pos[0], exactZ = pos[2];
                    const blockX = Math.floor(exactX), blockY = Math.floor(pos[1]), blockZ = Math.floor(exactZ);
                    const checkPlace = (x, y, z) => (playerEntity.checkTargetedBlockCanBePlacedOver([x, y, z]) || r.values(Fuxny.world)[47].call(Fuxny.world, x, y, z) === 0);
                    if (checkPlace(blockX, blockY - 1, blockZ)) { wangPlace([blockX, blockY - 1, blockZ]); return; }
                    const dx = exactX - blockX, dz = exactZ - blockZ;
                    const offsets = [];
                    if (dx < 0.3) offsets.push([-1, 0]); if (dx > 0.7) offsets.push([1, 0]);
                    if (dz < 0.3) offsets.push([0, -1]); if (dz > 0.7) offsets.push([0, 1]);
                    for (const [ox, oz] of offsets) {
                        const nx = blockX + ox, nz = blockZ + oz;
                        if (checkPlace(nx, blockY - 1, nz)) { wangPlace([nx, blockY - 1, nz]); return; }
                    }
                }, 50);
                showTemporaryNotification("Scaffold enabled");
            } else {
                clearInterval(scaffoldIntervalId);
                scaffoldIntervalId = null;
                showTemporaryNotification("Scaffold disabled");
            }
        });

        document.getElementById('hack-walljump')?.addEventListener('change', e => {
            if (!preCheck("Walljump", e.target)) return;
            const client = Fuxny?.clientOptions, body = Fuxny?.physics?.bodies?.[0];
            if (!client || !body) return;
            if (e.target.checked) {
                Object.defineProperty(client, "airJumpCount", { get: () => { if (!body.resting) return 0; const [rx, , rz] = body.resting; return (rx === 1 || rx === -1 || rz === 1 || rz === -1) ? 999 : 0; }, set(_) {}, configurable: true });
                showTemporaryNotification("Walljump enabled");
            } else {
                Object.defineProperty(client, "airJumpCount", { value: 0, writable: true, configurable: true });
                showTemporaryNotification("Walljump disabled");
            }
        });

        document.getElementById('hack-waterjump')?.addEventListener('change', e => {
             if (!preCheck("Waterjump", e.target)) return;
             const c = Fuxny?.entities?.[Fuxny.impKey]?.movement?.list?.[0];
             if (!c) return;
             if(e.target.checked) {
                try {
                    Object.defineProperty(c, "inAirFromWater", { get: () => false, set: () => {}, configurable: true });
                    Object.defineProperty(c, "_jumpCount", { get: () => 0, set: () => {}, configurable: true });
                    Object.defineProperty(c, "_ticksOutOfWater", { get: () => 346, set: () => {}, configurable: true });
                    Object.defineProperty(c, "isOnIce", { get: () => true, set: () => {}, configurable: true });
                    showTemporaryNotification("Waterjump enabled");
                } catch (err) { console.error("Error enabling waterjump:", err); }
             } else {
                try {
                    Object.defineProperty(c, "inAirFromWater", { value: false, writable: true, configurable: true });
                    Object.defineProperty(c, "_jumpCount", { value: 0, writable: true, configurable: true });
                    Object.defineProperty(c, "_ticksOutOfWater", { value: 0, writable: true, configurable: true });
                    Object.defineProperty(c, "isOnIce", { value: false, writable: true, configurable: true });
                    showTemporaryNotification("Waterjump disabled");
                } catch (err) { console.error("Error disabling waterjump:", err); }
             }
        });

        document.getElementById('hack-noclip-move')?.addEventListener('change', e => {
            if (!preCheck("Noclip Move", e.target)) return;
            if (e.target.checked) { startMoving(); showTemporaryNotification("Noclip Move enabled"); }
            else { stopMoving(); showTemporaryNotification("Noclip Move disabled"); }
        });

        document.getElementById('hack-kill-softly')?.addEventListener('change', e => {
            if (!preCheck("Kill Softly", e.target)) return;
            if (e.target.checked) { playerEntity.heldItemState.swingDuration = 1500; showTemporaryNotification("Kill Softly enabled"); }
            else { playerEntity.heldItemState.swingDuration = 200; showTemporaryNotification("Kill Softly disabled"); }
        });

        document.getElementById('hack-bhop-knife')?.addEventListener('change', e => {
            if (!preCheck("BHOP Knife", e.target)) return;
            if (e.target.checked) {
                bhopKnifeEnabled = true;
                spaceVid = document.createElement('video');
                spaceVid.src = 'https://files.catbox.moe/6tm4e7.webm';
                spaceVid.preload = 'auto'; spaceVid.loop = true; spaceVid.muted = false; spaceVid.volume = 0; spaceVid.playbackRate = 1; spaceVid.playsInline = true;
                Object.assign(spaceVid.style, { position: 'fixed', top: '50%', left: '50%', width: '100vw', height: '100vh', objectFit: 'cover', transform: 'translate(-50%, -50%) scaleX(1.4)', zIndex: 21, pointerEvents: 'none', opacity: '0', transition: 'opacity 2.5s ease', });
                document.body.appendChild(spaceVid);
                window.addEventListener('keydown', onKeyDown);
                window.addEventListener('keyup', onKeyUp);
                showTemporaryNotification("BHOP Knife enabled");
            } else {
                bhopKnifeEnabled = false;
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
                if (spaceVid) { spaceVid.pause(); if (spaceVid.parentNode) spaceVid.parentNode.removeChild(spaceVid); spaceVid = null; }
                spaceHeld = false;
                if (fadeVolumeInterval) clearInterval(fadeVolumeInterval);
                showTemporaryNotification("BHOP Knife disabled");
            }
        });

        document.getElementById('hack-auto-sw')?.addEventListener('click', () => { if (preCheck("Auto SW")) autoSW(); });
        document.getElementById('hack-noclip-place')?.addEventListener('click', () => {
            if (!preCheck("Noclip Place")) return;
            let pos = Fuxny.entities.getState(1, 'position').position;
            Fuxny.entities.setPosition(1, pos[0], pos[1], pos[2] + 1);
            let playerEntity = r.values(Fuxny.entities[Fuxny.impKey])[22].list[0];
            playerEntity._blockItem.placeBlock();
        });

        // --- Visuals ---
        document.getElementById('hack-esp')?.addEventListener('change', e => {
            if (!preCheck("ESP", e.target)) return;
            espEnabled = e.target.checked;
            const groupId = espEnabled ? 2 : 0;
            if (Array.isArray(r.values(Fuxny.rendering)[18].thinMeshes)) {
                for (const thinMesh of r.values(Fuxny.rendering)[18].thinMeshes) {
                    if (thinMesh?.mesh && typeof thinMesh.mesh.renderingGroupId === "number") {
                        thinMesh.mesh.renderingGroupId = groupId;
                    }
                }
            }
            showTemporaryNotification(`ESP ${espEnabled ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('hack-chest-esp')?.addEventListener('change', e => {
            if (!preCheck("Chest ESP", e.target)) return;
            chestESPEnabled = e.target.checked;
            if (chestESPEnabled || oreESPEnabled) {
                if (!chestOreInterval) { chestOreInterval = setInterval(scanAllChunks, 5000); }
                scanAllChunks();
            } else {
                if (chestOreInterval) { clearInterval(chestOreInterval); chestOreInterval = null; }
                clearESPBoxes();
            }
            showTemporaryNotification(`Chest ESP ${chestESPEnabled ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('hack-ore-esp')?.addEventListener('change', e => {
            if (!preCheck("Ore ESP", e.target)) return;
            oreESPEnabled = e.target.checked;
            if (chestESPEnabled || oreESPEnabled) {
                if (!chestOreInterval) { chestOreInterval = setInterval(scanAllChunks, 5000); }
                scanAllChunks();
            } else {
                if (chestOreInterval) { clearInterval(chestOreInterval); chestOreInterval = null; }
                clearESPBoxes();
            }
            showTemporaryNotification(`Ore ESP ${oreESPEnabled ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('hack-hitboxes')?.addEventListener('change', e => {
            if (!preCheck("Hitboxes", e.target)) return;
            hitBoxEnabled = e.target.checked;
            for (const eId in hitboxes) {
                const box = hitboxes[eId];
                if (box) box.isVisible = hitBoxEnabled;
            }
            showTemporaryNotification(`Hitboxes ${hitBoxEnabled ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('hack-nametags')?.addEventListener('change', e => {
            if (!preCheck("Nametags", e.target)) return;
            if (e.target.checked) {
                nameTagsEnabled = true;
                if (!cachedNameTagParent) { nameTagsEnabled = false; return; }
                nameTagParent = cachedNameTagParent;
                nameTagsIntervalId = setInterval(() => {
                    const entityList = Fuxny.entityList;
                    if (!entityList) return;
                    for (const subGroup of Object.values(entityList)) {
                        if (!subGroup) continue;
                        for (const obj of Object.values(subGroup)) {
                            if (obj?.lobbyLeaderboardValues) {
                                try {
                                    Object.defineProperty(obj, 'hasPriorityNametag', { get: () => true, set(v){}, configurable: true });
                                    Object.defineProperty(obj, 'canSee', { get: () => true, set(v){}, configurable: true });
                                } catch (e) {}
                            }
                        }
                    }
                    for (const key in nameTagParent) {
                        const tag = nameTagParent;
                        if (tag && typeof tag === 'object' && tag.id?.includes('NameTag')) {
                            try {
                                Object.defineProperty(tag, '_isVisible', { get: () => true, set(v){}, configurable: true });
                                Object.defineProperty(tag, 'renderingGroupId', { get: () => 3, set(v){}, configurable: true });
                            } catch (e) {}
                        }
                    }
                }, 15000);
                showTemporaryNotification("Nametags enabled");
            } else {
                nameTagsEnabled = false;
                clearInterval(nameTagsIntervalId);
                nameTagsIntervalId = null;
                if (nameTagParent) {
                    for (const key in nameTagParent) {
                        const tag = nameTagParent[key];
                        if (tag && typeof tag === 'object' && tag.id?.includes('NameTag')) {
                            try {
                                const current = tag._isVisible;
                                delete tag._isVisible;
                                tag._isVisible = current;
                            } catch (e) {}
                        }
                    }
                }
                nameTagParent = null;
                showTemporaryNotification("Nametags disabled");
            }
        });

        document.getElementById('hack-enemy-health')?.addEventListener('change', e => {
             if (!preCheck("Enemy Health", e.target)) return;
             if (e.target.checked) {
                 startHealthWatcher();
                 showTemporaryNotification("Enemy Health enabled");
             } else {
                if (healthWatcherInterval) clearInterval(healthWatcherInterval);
                if (resetTimeout) clearTimeout(resetTimeout);
                setHealthBar(100, false);
                lastPercent = null;
                showTemporaryNotification("Enemy Health disabled");
             }
        });

        document.getElementById('hack-night')?.addEventListener('change', e => {
            if (!preCheck("Night", e.target)) return;
            if(e.target.checked) {
                if(!skyboxMesh) {
                    for (let i = 0; i < 10000; i++) {
                        const meshState = Fuxny.entities.getState(i, "mesh");
                        if (meshState?.mesh?.id === "skyBox") {
                            skyboxEntity = i; skyboxMesh = meshState.mesh; break;
                        }
                    }
                }
                if(skyboxMesh) skyboxMesh.isVisible = false;
                showTemporaryNotification("Night enabled");
            } else {
                if(skyboxMesh) skyboxMesh.isVisible = true;
                showTemporaryNotification("Night disabled");
            }
        });

        document.getElementById('hack-bigheads')?.addEventListener('change', e => {
            if (!preCheck("Bigheads", e.target)) return;
            const objectData = r.values(Fuxny.rendering)[18].objectData;
            if (e.target.checked) {
                for (let key in objectData) {
                    let obj = objectData[key];
                    if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                        let node = obj.nodes[16];
                        node.scale._x = 6; node.scale._y = 6; node.scale._z = 6;
                        node.position._y = -1;
                    }
                }
                bigHeadsInterval = setInterval(() => {
                    for (let key in objectData) {
                        let obj = objectData[key];
                        if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                            let node = obj.nodes[16];
                            if (node.scale._x === 1) {
                                node.scale._x = 6; node.scale._y = 6; node.scale._z = 6;
                                node.position._y = -1;
                            }
                        }
                    }
                }, 10000);
                showTemporaryNotification("Bigheads enabled");
            } else {
                for (let key in objectData) {
                    let obj = objectData[key];
                    if (obj?.type === "Player" && obj.nodes?.[16] && obj !== objectData[1]) {
                         let node = obj.nodes[16];
                         node.scale._x = 1; node.scale._y = 1; node.scale._z = 1;
                         node.position._y = 0.7199999690055847;
                    }
                }
                clearInterval(bigHeadsInterval);
                bigHeadsInterval = null;
                showTemporaryNotification("Bigheads disabled");
            }
        });

        // --- Experimental ---
        document.getElementById('hack-blink')?.addEventListener('change', e => {
            if (!preCheck("Blink", e.target)) return;
            toggleBlink();
            showTemporaryNotification(`Blink ${blinkState.enabled ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('hack-pickup-reach')?.addEventListener('change', e => {
            if (!preCheck("Pickup Reach", e.target)) return;
            if (e.target.checked) {
                 if (!proto || !originalGetEntitiesInAABB) {
                    const cls = findClassConstructor(Fuxny.noa.entities);
                    if (!cls) { console.warn("[pickupReach] Could not find class constructor"); return; }
                    const ghMethod = findGhMethod(cls);
                    if (!ghMethod) { console.warn("[pickupReach] Could not find getEntitiesInAABB method"); return; }
                    proto = cls.prototype;
                    originalGetEntitiesInAABB = ghMethod.fn;
                    ghMethodKey = ghMethod.key;
                }
                proto[ghMethodKey] = function(box, name) {
                    const center = [(box.base[0] + box.max[0]) / 2, (box.base[1] + box.max[1]) / 2, (box.base[2] + box.max[2]) / 2];
                    const halfSize = [(box.max[0] - box.base[0]) / 2, (box.max[1] - box.base[1]) / 2, (box.max[2] - box.base[2]) / 2];
                    const enlarged = { base: center.map((c, i) => c - halfSize[i] * RANGE_MULTIPLIER), max: center.map((c, i) => c + halfSize[i] * RANGE_MULTIPLIER) };
                    return originalGetEntitiesInAABB.call(this, enlarged, name);
                };
                pickupReachEnabled = true;
                showTemporaryNotification("Pickup Reach enabled");
            } else {
                if(proto && ghMethodKey) proto[ghMethodKey] = originalGetEntitiesInAABB;
                pickupReachEnabled = false;
                showTemporaryNotification("Pickup Reach disabled");
            }
        });

        document.getElementById('hack-spawn-teleport')?.addEventListener('click', () => {
            if (!preCheck("Spawn Teleport")) return;
            function findElementByText(text) {
                const all = document.querySelectorAll('div, span, button, a');
                for (const el of all) if (el.textContent.trim() === text) return el;
                return null;
            }
            const teleportButtonText = findElementByText('Teleport To Lobby Spawn');
            if (teleportButtonText) {
                let clickable = teleportButtonText;
                while (clickable && !clickable.onclick && clickable.tagName !== 'BUTTON') clickable = clickable.parentElement;
                if (clickable) clickable.click();
                else teleportButtonText.click();
                showTemporaryNotification("Teleporting to spawn...");
            } else showTemporaryNotification("Teleport button not found.");
        });

        document.getElementById('hack-anti-web')?.addEventListener('click', () => {
            if (!preCheck("Anti-Web")) return;
            Object.defineProperty(Fuxny.entities[Fuxny.impKey].moveState.list[0].speedMultiplier.multipliers, "inCobweb", { configurable: true, enumerable: true, get() { return 1; }, set(value) {} });
            showTemporaryNotification("Anti-Web applied");
        });

        // --- Settings ---
        document.getElementById('hack-health-color')?.addEventListener('click', () => {
             const healthBar = document.getElementsByClassName("BottomScreenStatBar")[0];
             if (healthBar) {
                healthBar.style.background = defaultAccent;
                showTemporaryNotification("Health bar color set");
             }
        });

        document.getElementById('hack-ranks')?.addEventListener('click', () => {
            if (!preCheck("Ranks")) return;
            Fuxny.entityList[1][1].ranks[0] = "developer";
            Fuxny.entityList[1][1].ranks[1] = "youtuber";
            Fuxny.entityList[1][1].ranks[2] = "super";
            showTemporaryNotification("Ranks spoofed");
        });

        document.getElementById('hack-player-coords')?.addEventListener('click', () => {
            if (!preCheck("Player Coords")) return;
            for (const key in Fuxny.bloxd.entityNames) {
                if (key === "1") continue;
                const nameObj = Fuxny.bloxd.entityNames[key];
                const state = Fuxny.entities.getState(key, 'position');
                if (!state || !state.position) continue;
                const pos = state.position;
                const x = Math.round(pos[0]); const y = Math.round(pos[1]); const z = Math.round(pos[2]);
                const baseName = nameObj.entityName.replace(/\s*\(\-?\d+,\s*\-?\d+,\s*\-?\d+\)$/, "");
                nameObj.entityName = `${baseName} (${x}, ${y}, ${z})`;
            }
            showTemporaryNotification("Player coords updated in leaderboard");
        });

        document.getElementById('hack-purge-cookies')?.addEventListener('click', () => {
            window.onbeforeunload = null;
            const deleteCookie = (name, path = "/", domain = "") => {
                let cookieStr = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};`;
                if (domain) cookieStr += `domain=${domain};`;
                document.cookie = cookieStr;
            };
            const cookies = document.cookie.split(";");
            cookies.forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
                deleteCookie(name, "/");
                const hostname = location.hostname;
                const domainParts = hostname.split(".");
                if (domainParts.length > 2) {
                    const baseDomain = domainParts.slice(-2).join(".");
                    deleteCookie(name, "/", baseDomain);
                }
            });
            showTemporaryNotification("Cookies purged. Reloading...");
            setTimeout(() => location.reload(), 150);
        });

        document.getElementById('hack-discord')?.addEventListener('click', () => {
            window.open("https://discord.gg/G6ksFfQdaW", "_blank");
        });
    }

    setupHackEventListeners();

    const modulesToRender = [];
    function renderLoop() {
        for (const module of modulesToRender) {
            module.onRender();
        }
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
})();
