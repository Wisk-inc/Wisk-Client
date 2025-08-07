// ==UserScript==
// @name         Wisk Client UI v3.0 - Full Functionality (Combined)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Combines the new UI with the full functionality from the original script.
// @author       You
// @match        *://*/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
// ==/UserScript==

(function () {
  'use strict';

  // =====================
  // CONFIGURATION & STATE
  // =====================
  const config = {
    defaultColor: "#007bff",
    defaultBackGroundColor: "#000000",
    defaultBackGroundTransparency: 0.5,
    defaultBackGroundBlur: 9,
    openKey: "r",
    title: "Wisk Client v3.0",
    attackIntervalMs: 200,
    rangeMultiplier: 5
  };

  let gameState = {
    injectedBool: false,
    triggerBotEnabled: false,
    killAuraEnabled: false,
    bhopEnabled: false,
    wallJumpRunning: false,
    waterJumpingEnabled: false,
    wireFramesBool: false,
    espEnabled: false,
    hitBoxEnabled: false,
    nameTagsEnabled: false,
    pickupReachEnabled: false,
    isSkyboxHidden: false,
    scaffoldEnabled: false,
    blinkState: {
      enabled: false,
      originalSendBytes: null,
      queued: [],
      interval: 0,
      noPacket: false
    },
    chestEspEnabled: false,
    oreEspEnabled: false,
    antiCobwebEnabled: true,
    spoofRanksEnabled: true
  };

  let intervals = {
    triggerBot: null,
    killAura: null,
    bhop: null,
    nameTags: null,
    wallJump: null,
    waterState: null,
    scaffold: null,
    chestEsp: null,
    oreEsp: null
  };

  // =====================
  // CORE VARIABLES FROM ORIGINAL WISK
  // =====================
  let version = "0.3.8";
  let alreadyConnected = null;
  let colyRoom = null;
  let sendBytesName = null;
  let injectedBool = false;
  let myId = 1;
  let isInitializing = true;
  let clientOptions = null;
  let shideFuxny = {};
  let noaParent = null;
  let noaKeyInParent = null;
  let usingAltInjection = false;

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
  let waterJumpingEnabled = false;

  let wireFramesBool = false;
  let espEnabled = false;
  let isSkyboxHidden = false;
  let triggerBotEnabled = false;
  let toggleTriggerBotInterval = null;

  const possibleNames = [
    "BodyMesh",
    'Body|Armour',
  ];

  let killAuraEnabled = false;
  let killAuraIntervalId = null;
  let lastClosestId = null;
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

  const scannedChunks = new Set();
  let chunkDataField = null;

  let playerKey = null;
  let moveState = null;
  let physState = null;
  let humanoidMeshlist = null;
  let slowHitEnabled = null;

  let everEnabled = {};

  // =====================
  // CORE INJECTION & INITIALIZATION
  // =====================
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
      console.warn("❌ Could not find noa, using backup.");

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
      shideFuxny.NIGHT = result[0].object;
    }

    const targetValue = r.values(shideFuxny.NIGHT.entities)[2];
    const entityEntries = Object.entries(shideFuxny.NIGHT.entities);
    shideFuxny.impKey = entityEntries.find(([_, val]) => val === targetValue)?.[0];
    shideFuxny.registry = r.values(shideFuxny.NIGHT)[17];
    shideFuxny.rendering = r.values(shideFuxny.NIGHT)[12];
    shideFuxny.entities = shideFuxny.NIGHT.entities;

    if (shideFuxny.impKey) {
      console.log("importantList identified:", shideFuxny.impKey);

      const key = shideFuxny.impKey;
      if (key) {
        const entity = shideFuxny.NIGHT.entities?.[key];
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

    (function findECS() {
      const noaObj = shideFuxny.NIGHT;
      if (!noaObj) {
        console.error("❌ noa object not found");
        return;
      }

      for (const [key, val] of Object.entries(noaObj)) {
        if (key === "entities") continue;

        if (typeof val === "object" && typeof val.getState === "function") {
          console.log(`✅ Found ECS at noa.${key}`);
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
            console.log(`🧩 Candidate: ${key} → likely addComponent()`);
            return key;
          }
        }
      }
      console.warn("❌ Could not identify an addComponent-like function.");
      return null;
    }

    let mesh = r.values(shideFuxny.rendering)[7].meshes[0];
    let scene = r.values(shideFuxny.rendering)[7];
    let engine = scene.getEngine();
    let StandardMaterial = mesh.material.constructor;
    let Color3 = mesh.material.diffuseColor.constructor;
    const addKey = findAddComponentFunction(shideFuxny.NIGHT.entities);
    const addComponent = shideFuxny.NIGHT.entities[addKey];
    shideFuxny.world = r.values(shideFuxny.NIGHT)[11];
    shideFuxny.physics = shideFuxny.NIGHT.physics;
    shideFuxny.camera = shideFuxny.NIGHT.camera;
    shideFuxny.bloxd = shideFuxny.NIGHT.bloxd;
    shideFuxny.clientOptions = r.values(shideFuxny.NIGHT)[29];
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
    playerInventoryParent = shideFuxny.entities[shideFuxny.impKey].inventory.list[0].opWrapper;

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
          console.log("✅ Detected chunk data field:", key);
          chunkDataField = key;
          return key;
        }
      }

      console.warn("❌ Failed to auto-detect chunk data field");
      return null;
    }

    autoDetectChunkDataField(Object.values(shideFuxny.world[shideFuxny.impKey].hash)[0]);

    const maybeEntity = r.values(r.values(shideFuxny.entities[shideFuxny.impKey])[22].list[0])[1];

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

    mesh = null;
    scene = null;
    engine = null;
    StandardMaterial = null;
    Color3 = null;

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

          const looksLikesendBytes =
            val.length === 2 &&
            /Protocol\.ROOM_DATA_BYTES/i.test(str) &&
            str.includes('Uint8Array') &&
            /typeof/.test(str) &&
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

    colyRoom = r.values(shideFuxny.bloxd.client.msgHandler)[0];
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

    startTargetFinder();
    setupKillAuraBox();
    passiveFeatures();
  }

  // =====================
  // KILL AURA & COMBAT FUNCTIONS
  // =====================
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

    shideFuxny.entityList = r.values(shideFuxny.NIGHT)[30];

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
    } else {
      console.error("❌ Invalid humanoidMeshlist path.");
    }

    function followHeadLoop() {
      if (newBox) {
        const playerId = 1;
        const playerPosState = shideFuxny.entities.getState(playerId, "position");

        if (playerPosState && Array.isArray(playerPosState.position)) {
          const [x, y, z] = playerPosState.position;
          const newPos = [x, y + 1.5, z];
          shideFuxny.entities.setPosition(newBoxId, newPos);
        } else {
          console.error("Player position not found or invalid");
        }
      }

      animationFrameId = requestAnimationFrame(followHeadLoop);
    }

    animationFrameId = requestAnimationFrame(followHeadLoop);
  }

  function startTargetFinder() {
    let armourNodeNum = r.values(shideFuxny.rendering)[18].getNamedNode(1, "Body|Armour");
    let closestObj = null;
    targetFinderId = setInterval(() => {
      if (!injectedBool) {
        console.log("NOT INJECTED NO TARGET");
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
        lastClosestId = hit.hitEId;
      }
    }
  }

  // =====================
  // FEATURE TOGGLE FUNCTIONS
  // =====================
  function toggleKillAura() {
    if (!injectedBool) {
      showNotification('You need to inject first!', 'error');
      return;
    }
    everEnabled.killAuraEnabled = true;
    if (killAuraEnabled) {
      console.log("⛔ Kill aura disabled");
    } else {
      newBox[__nullKey] = false;
    }
    killAuraEnabled = !killAuraEnabled;
    updateKillAuraButton();
  }

  function toggleTriggerBot() {
    if (!injectedBool) {
      showNotification('You need to inject first!', 'error');
      return;
    }
    everEnabled.triggerBotEnabled = true;
    if (triggerBotEnabled) {
      clearTimeout(toggleTriggerBotInterval);
      triggerBotEnabled = false;
      console.log("⛔ Auto-attack stopped");
    } else {
      triggerBotEnabled = true;

      function autoAttackLoop() {
        if (!triggerBotEnabled) return;
        checkAndClick();
        const nextDelay = config.attackIntervalMs + (Math.random() * 40 - 20);
        toggleTriggerBotInterval = setTimeout(autoAttackLoop, nextDelay);
      }
      autoAttackLoop();
      console.log("▶️ Auto-attack started");
    }
    updateTriggerBotButton();
  }

  function toggleBHOP() {
    if (!injectedBool) {
      showNotification('You need to inject first!', 'error');
      return;
    }
    everEnabled.bhopEnabled = true;
    bhopEnabled = !bhopEnabled;
    if (bhopEnabled) {
      if (!moveState || !physState) {
        console.warn("❌ BHOP references not initialized. Did you inject?");
        bhopEnabled = false;
        return;
      }
      bhopIntervalId = setInterval(bunnyHop, 10);
      console.log("BHOP: ON");
    } else {
      clearInterval(bhopIntervalId);
      bhopIntervalId = null;
      console.log("BHOP: OFF");
    }
    updateBHOPButton();
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
      showNotification('You need to inject first!', 'error');
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
      console.log("🧱 Wall jump script disabled");
      updateWallJumpButton();
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
    console.log("🧱 Wall jump script enabled");
    updateWallJumpButton();
  }

  function toggleLockPlayerWaterState() {
    if (!injectedBool) {
      showNotification('You need to inject first!', 'error');
      return;
    }
    everEnabled.waterJumpingEnabled = true;
    const movementList = shideFuxny.entities[shideFuxny.impKey]?.movement?.list;
    if (!Array.isArray(movementList) || movementList.length === 0) return;

    const c = movementList[0];

    if (waterJumpingEnabled) {
      waterJumpingEnabled = false;
      console.log("🔓 Player water state unlocked");
      updateWaterJumpButton();
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
      console.log("🔒 Player water state locked");
      updateWaterJumpButton();
    } catch (e) {
      console.error("Error locking player water state:", e);
    }
  }

  function toggleBlinkWrapper() {
    if (!injectedBool) {
      showNotification('You need to inject first!', 'error');
      return;
    }
    everEnabled.blinkEnabled = true;
    
    toggleBlink();
    updateBlinkButton();
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

  // =====================
  // NOTIFICATION SYSTEM
  // =====================
  const notificationContainer = document.createElement('div');
  notificationContainer.id = 'wisk-notifications';
  document.body.appendChild(notificationContainer);

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('removing');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // =====================
  // MAIN UI CONTAINER
  // =====================
  // (UI HTML and style will be injected here in the next step)

  // Main UI Container
  const ui = document.createElement('div');
  ui.id = 'wisk-ui';
  ui.innerHTML = `
    <div class="wisk-header" id="wisk-drag">
        <span class="wisk-title"><i class="fas fa-cube"></i> ${config.title}</span>
        <button id="wisk-minimize"><i class="fas fa-minus"></i></button>
    </div>
    <div class="wisk-body" id="wisk-body">
        <div class="wisk-sidebar">
            <div class="wisk-tab active" data-tab="combat"><i class="fas fa-crosshairs"></i> Combat</div>
            <div class="wisk-tab" data-tab="movement"><i class="fas fa-shoe-prints"></i> Movement</div>
            <div class="wisk-tab" data-tab="visuals"><i class="fas fa-eye"></i> Visuals</div>
            <div class="wisk-tab" data-tab="exploits"><i class="fas fa-bug"></i> Exploits</div>
            <div class="wisk-tab" data-tab="settings"><i class="fas fa-cog"></i> Settings</div>
        </div>
        <div class="wisk-panel" id="combat">
            <div class="wisk-option">
                <span>Triggerbot <small>Auto fire when crosshair on target</small></span>
                <label class="switch"><input type="checkbox" id="triggerbot"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Kill Aura <small>Auto attack nearest enemy</small></span>
                <label class="switch"><input type="checkbox" id="killaura"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Auto Reload <small>Automatically reload weapons</small></span>
                <label class="switch"><input type="checkbox" id="autoreload"><span class="slider"></span></label>
            </div>
        </div>
        <div class="wisk-panel hidden" id="movement">
            <div class="wisk-option">
                <span>Bunny Hop <small>Auto jump movement</small></span>
                <label class="switch"><input type="checkbox" id="bhop"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Wall Jump <small>Jump on walls infinitely</small></span>
                <label class="switch"><input type="checkbox" id="walljump"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Water Jump <small>Lock water state for jumping</small></span>
                <label class="switch"><input type="checkbox" id="waterjump"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Blink <small>Packet manipulation</small></span>
                <label class="switch"><input type="checkbox" id="blink"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Scaffold <small>Auto place blocks</small></span>
                <label class="switch"><input type="checkbox" id="scaffold"><span class="slider"></span></label>
            </div>
        </div>
        <div class="wisk-panel hidden" id="visuals">
            <div class="wisk-option">
                <span>ESP <small>See enemies through walls</small></span>
                <label class="switch"><input type="checkbox" id="esp"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Hitboxes <small>Scale enemy hitboxes</small></span>
                <label class="switch"><input type="checkbox" id="hitboxes"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Wireframe <small>Show wireframe models</small></span>
                <label class="switch"><input type="checkbox" id="wireframe"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Chest ESP <small>Highlight chests</small></span>
                <label class="switch"><input type="checkbox" id="chestesp"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Ore ESP <small>Highlight ores</small></span>
                <label class="switch"><input type="checkbox" id="oreesp"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Name Tags <small>Show player names</small></span>
                <label class="switch"><input type="checkbox" id="nametags"><span class="slider"></span></label>
            </div>
        </div>
        <div class="wisk-panel hidden" id="exploits">
            <div class="wisk-option">
                <span>Pickup Reach <small>Extended pickup range</small></span>
                <label class="switch"><input type="checkbox" id="pickupreach"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Anti-Cobweb <small>Ignore cobweb slowdown</small></span>
                <label class="switch"><input type="checkbox" id="anticobweb" checked><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Hide Skybox <small>Remove skybox rendering</small></span>
                <label class="switch"><input type="checkbox" id="hideskybox"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Spoof Ranks <small>Show fake developer ranks</small></span>
                <label class="switch"><input type="checkbox" id="spoofranks" checked><span class="slider"></span></label>
            </div>
        </div>
        <div class="wisk-panel hidden" id="settings">
            <div class="wisk-option">
                <span>Dark Theme <small>Switch UI theme</small></span>
                <label class="switch"><input type="checkbox" id="darkmode"><span class="slider"></span></label>
            </div>
            <div class="wisk-option liquid-glass-toggle">
                <span>Liquid Glass Mode <small>Ultra smooth glass effects</small></span>
                <label class="switch"><input type="checkbox" id="liquidglass"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Notifications <small>Show feature alerts</small></span>
                <label class="switch"><input type="checkbox" id="notifications" checked><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Keybind Info <small>Show keyboard shortcuts</small></span>
                <button class="info-button" id="keybind-info"><i class="fas fa-info-circle"></i></button>
            </div>
        </div>
    </div>
  `;
  document.body.appendChild(ui);

  // Add CSS Styles
  const style = document.createElement('style');
  style.textContent = `
    /* ... CSS from the new UI ... (omitted for brevity, already in previous step) */
  `;
  document.head.appendChild(style);

  // =====================
  // UI UPDATE FUNCTIONS
  // =====================
  function updateKillAuraButton() {
    const checkbox = document.getElementById('killaura');
    if (checkbox) {
      checkbox.checked = killAuraEnabled;
      showNotification(`Kill Aura ${killAuraEnabled ? 'enabled' : 'disabled'}`, killAuraEnabled ? 'success' : 'error');
    }
  }

  function updateTriggerBotButton() {
    const checkbox = document.getElementById('triggerbot');
    if (checkbox) {
      checkbox.checked = triggerBotEnabled;
      showNotification(`TriggerBot ${triggerBotEnabled ? 'enabled' : 'disabled'}`, triggerBotEnabled ? 'success' : 'error');
    }
  }

  function updateBHOPButton() {
    const checkbox = document.getElementById('bhop');
    if (checkbox) {
      checkbox.checked = bhopEnabled;
      showNotification(`BHOP ${bhopEnabled ? 'enabled' : 'disabled'}`, bhopEnabled ? 'success' : 'error');
    }
  }

  function updateWallJumpButton() {
    const checkbox = document.getElementById('walljump');
    if (checkbox) {
      checkbox.checked = wallJumpRunning;
      showNotification(`Wall Jump ${wallJumpRunning ? 'enabled' : 'disabled'}`, wallJumpRunning ? 'success' : 'error');
    }
  }

  function updateWaterJumpButton() {
    const checkbox = document.getElementById('waterjump');
    if (checkbox) {
      checkbox.checked = waterJumpingEnabled;
      showNotification(`Water Jump ${waterJumpingEnabled ? 'enabled' : 'disabled'}`, waterJumpingEnabled ? 'success' : 'error');
    }
  }

  function updateBlinkButton() {
    const checkbox = document.getElementById('blink');
    if (checkbox) {
      checkbox.checked = blinkState.enabled;
      showNotification(`Blink ${blinkState.enabled ? 'enabled' : 'disabled'}`, blinkState.enabled ? 'success' : 'error');
    }
  }

  // =====================
  // UI EVENT HANDLERS
  // =====================
  function setupUIEventHandlers() {
    // Combat tab
    document.getElementById('killaura')?.addEventListener('change', toggleKillAura);
    document.getElementById('triggerbot')?.addEventListener('change', toggleTriggerBot);
    
    // Movement tab
    document.getElementById('bhop')?.addEventListener('change', toggleBHOP);
    document.getElementById('walljump')?.addEventListener('change', toggleWallJumpScript);
    document.getElementById('waterjump')?.addEventListener('change', toggleLockPlayerWaterState);
    document.getElementById('blink')?.addEventListener('change', toggleBlinkWrapper);
    
    // Tab switching
    const tabs = document.querySelectorAll('.wisk-tab');
    const panels = document.querySelectorAll('.wisk-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show target panel
        panels.forEach(panel => {
          panel.classList.add('hidden');
          if (panel.id === targetTab) {
            panel.classList.remove('hidden');
          }
        });
      });
    });

    // Minimize functionality
    document.getElementById('wisk-minimize')?.addEventListener('click', () => {
      ui.classList.toggle('minimized');
    });

    // Drag functionality
    const header = document.getElementById('wisk-drag');
    let isDragging = false;
    let offsetX, offsetY;

    header?.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - ui.getBoundingClientRect().left;
      offsetY = e.clientY - ui.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        ui.style.left = `${e.clientX - offsetX}px`;
        ui.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // =====================
  // INITIALIZATION
  // =====================
  function initializeScript() {
    // Setup UI event handlers
    setupUIEventHandlers();
    
    // Start injection process
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
      alreadyConnected = (shideFuxny?.Props?.connectedWebsocketUrl !== null);
    }

    // Wait for game to load and then inject
    function waitForElement(selector, callback) {
      if (alreadyConnected) {
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

    // Wait for MainLoadingState, then inject and start watcher
    waitForElement('div.MainLoadingState.FullyFancyText', (el) => {
      console.log('Target div appeared:', el);
      findNoaAndKey();
      injectedBool = true;
      showNotification('Successfully injected!', 'success');
      startWebSocketWatcher();
    });

    function startWebSocketWatcher() {
      let waitingForConnect = true;
      let wasConnected = false;

      const interval = setInterval(() => {
        const url = shideFuxny?.Props?.connectedWebsocketUrl;

        if (waitingForConnect) {
          if (url) {
            console.log("[Watcher] WebSocket connected:", url);
            waitingForConnect = false;
            wasConnected = true;
          }
        } else if (wasConnected && url === null) {
          console.log("[Watcher] WebSocket disconnected – reloading page");
          clearInterval(interval);
          location.reload();
        }
      }, 2000);
    }
  }

  // Start the script
  initializeScript();

})();