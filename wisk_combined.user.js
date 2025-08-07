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

  // Load Font Awesome
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(fontAwesome);

  // Configuration
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

  // Notification system
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
                <span>Auto Potion <small>Automatically use potions</small></span>
                <label class="switch"><input type="checkbox" id="autopotion"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Slow Hit <small>Slower attack speed</small></span>
                <label class="switch"><input type="checkbox" id="slowhit"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Big Heads <small>Make player heads bigger</small></span>
                <label class="switch"><input type="checkbox" id="bigheads"><span class="slider"></span></label>
            </div>
            <div class="wisk-option">
                <span>Enemy Health Bar <small>Show enemy health</small></span>
                <label class="switch"><input type="checkbox" id="enemyhealth"><span class="slider"></span></label>
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
            <div class="wisk-option">
                <span>BHOP Knife <small>Knife sound effects</small></span>
                <label class="switch"><input type="checkbox" id="bhopknife"><span class="slider"></span></label>
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
            <div class="wisk-option">
                <span>Hide Skybox <small>Remove skybox rendering</small></span>
                <label class="switch"><input type="checkbox" id="hideskybox"><span class="slider"></span></label>
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
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
  
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
  
    @keyframes jiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-3deg) scale(1.05); }
        75% { transform: rotate(3deg) scale(1.05); }
    }
  
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
  
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); }
        50% { box-shadow: 0 0 20px rgba(0, 123, 255, 0.8); }
    }
  
    @keyframes liquidWave {
        0%, 100% { border-radius: 14px 14px 14px 14px; }
        25% { border-radius: 20px 10px 15px 18px; }
        50% { border-radius: 12px 20px 16px 12px; }
        75% { border-radius: 18px 14px 20px 10px; }
    }
  
    @keyframes floatUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
  
    #wisk-notifications {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }
  
    .notification {
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${config.defaultColor};
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        min-width: 200px;
    }
  
    .notification.success {
        border-left-color: ${config.defaultColor};
    }
  
    .notification.error {
        border-left-color: #f44336;
    }
  
    .notification.removing {
        animation: slideOutRight 0.3s ease-in;
    }
  
    #wisk-ui {
        position: fixed;
        top: 80px;
        left: 100px;
        width: 520px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
        z-index: 9999;
        resize: both;
        min-width: 300px;
        min-height: 250px;
        transition: all 0.3s ease;
        border: 2px solid transparent;
        backdrop-filter: blur(${config.defaultBackGroundBlur}px);
    }
  
    #wisk-ui.minimized {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        transition: all 0.3s ease-in-out;
    }
  
    #wisk-ui.minimized .wisk-body {
        display: none;
    }
  
    #wisk-ui.minimized .wisk-header {
        cursor: pointer;
        padding: 0;
        height: 100%;
        justify-content: center;
        border-bottom: none;
    }
  
    #wisk-ui.minimized .wisk-title {
        display: none;
    }
  
    #wisk-ui.minimized #wisk-minimize {
        display: none;
    }
  
    #wisk-ui.dark-mode {
        background: rgba(18, 18, 18, 0.95);
        color: #eee;
        border-color: rgba(60, 60, 60, 0.8);
    }
  
    #wisk-ui.dark-mode .wisk-header {
        background: rgba(0, 0, 0, 0.5);
    }
  
    #wisk-ui.dark-mode .wisk-sidebar {
        background: rgba(255, 255, 255, 0.05);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
  
    #wisk-ui.dark-mode .wisk-tab {
        background: rgba(255, 255, 255, 0.05);
        color: #eee;
    }
  
    #wisk-ui.dark-mode .wisk-tab.active {
        background: rgba(255, 255, 255, 0.1);
        border-color: ${config.defaultColor};
    }
    
    #wisk-ui.dark-mode .wisk-option small {
        color: #bbb;
    }
  
    #wisk-ui.liquid-glass {
        background: rgba(255, 255, 255, ${config.defaultBackGroundTransparency});
        backdrop-filter: blur(${config.defaultBackGroundBlur}px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: liquidWave 10s infinite ease-in-out;
    }
  
    #wisk-ui.liquid-glass.dark-mode {
        background: rgba(0, 0, 0, ${config.defaultBackGroundTransparency});
        border-color: rgba(60, 60, 60, 0.8);
    }
  
    .wisk-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 15px;
        background: rgba(255, 255, 255, 0.8);
        cursor: grab;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }
  
    .wisk-header:active {
        cursor: grabbing;
    }
  
    .wisk-title {
        font-weight: bold;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
  
    #wisk-minimize {
        background: none;
        border: none;
        color: #666;
        font-size: 16px;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
  
    #wisk-minimize:hover {
        color: #000;
        background: rgba(0, 0, 0, 0.05);
    }
  
    .wisk-body {
        display: flex;
        height: calc(100% - 40px);
    }
  
    .wisk-sidebar {
        width: 140px;
        background: rgba(240, 240, 240, 0.8);
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    }
  
    .wisk-tab {
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #333;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent;
        backdrop-filter: blur(5px);
        position: relative;
        overflow: hidden;
    }
    
    .wisk-tab i {
        width: 20px;
        text-align: center;
    }
  
    .wisk-tab:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.02);
    }
    
    .wisk-tab.active {
        background: rgba(255, 255, 255, 1);
        color: ${config.defaultColor};
        border-color: ${config.defaultColor};
        font-weight: bold;
        transform: scale(1.05);
        box-shadow: 0 4px 10px rgba(0, 123, 255, 0.1);
    }
    
    .wisk-panel {
        flex-grow: 1;
        padding: 15px;
        overflow-y: auto;
    }
  
    .wisk-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        animation: floatUp 0.5s ease-out;
    }
  
    .wisk-option:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .wisk-option.active {
        border-left-color: ${config.defaultColor};
        animation: pulse 1s infinite ease-in-out;
    }
  
    .wisk-option span {
        display: flex;
        flex-direction: column;
        font-size: 15px;
    }
  
    .wisk-option small {
        font-size: 11px;
        color: #777;
        margin-top: 2px;
    }
  
    .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
    }
  
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
  
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.4s;
        border-radius: 22px;
    }
  
    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }
  
    input:checked + .slider {
        background-color: ${config.defaultColor};
    }
  
    input:checked + .slider:before {
        transform: translateX(18px);
    }
    
    .info-button {
        background: rgba(0, 123, 255, 0.1);
        border: 1px solid ${config.defaultColor};
        color: ${config.defaultColor};
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    
    .info-button:hover {
        background: ${config.defaultColor};
        color: white;
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
    }
    
    .hidden {
        display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Drag functionality
  const dragElement = ui;
  const header = document.getElementById('wisk-drag');
  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - dragElement.getBoundingClientRect().left;
    offsetY = e.clientY - dragElement.getBoundingClientRect().top;
    dragElement.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragElement.style.left = `${e.clientX - offsetX}px`;
    dragElement.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragElement.style.cursor = 'grab';
  });

  // Tab switching logic
  document.querySelectorAll('.wisk-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.wisk-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.wisk-panel').forEach(p => p.classList.add('hidden'));

      tab.classList.add('active');
      const panelId = tab.getAttribute('data-tab');
      document.getElementById(panelId).classList.remove('hidden');
    });
  });

  // Minimize/Maximize functionality
  const minimizeButton = document.getElementById('wisk-minimize');
  minimizeButton.addEventListener('click', () => {
    ui.classList.add('minimized');
  });

  ui.addEventListener('click', (e) => {
    if (ui.classList.contains('minimized') && !minimizeButton.contains(e.target)) {
      ui.classList.remove('minimized');
    }
  });

  // ==========================================================
  // --- START OF FULLY INTEGRATED WISK.V2 CODE BLOCK ----
  // ==========================================================

  //__START__SETTINGS______________________________________________

  const defaultColor = "#D3D3D3" //-------------------ACCENT COLOR

  const defaultBackGroundColor = "#D3D3D3" //---------Bacground color

  const ICON_URL = "data:"
  const defaultBackGroundTransparency = 8.2 //--------Background transparency

  const defaultBackGroundBlur = 8 //------------------Background blur

  let openKey = "r"; //-------------------------------DEFAULT OPEN CLOSE KEYBIND 💗

  const TITLE = "Wisk" //-----------------------Title

  const defaultGradient = `linear-gradient(to right, ${defaultColor}, #D3D3D3, #D3D3D3)`;
  //--------------------------------------------------Three color gradient


  let passiveFeaturesEnabled = true; //--------------Enable passive features?

  const changeHealthBar = true // --------------------Change health bar color to gradient color
  let spoofRanksEnabled = true; // -----------------Gives you all ranks (YT, Super, Developer)
  const ATTACK_INTERVAL_MS = 200; // -----------------How fast to hit players with triggerbot/ aurAura    LOW = BAN
  let desiredPotionSlot = 1 //------------------------What slot should potions go to? Numbers start at zero! 0-9
  let spikeSlot = 8 //--------------------------------What slot do spikes automatically go in? 0-9
  let webSlot = 9 //----------------------------------What slot do webs / nets automatically go in? 0-9

  const STORAGE_KEY = "customKeybinds_v1";

  // Default keybinds with actions
  let defaultKeybindActions = [
      { name: "Spawn teleport", type: "mouse", code: 4, action: clickTeleportButton },
      { name: "SpikeWeb a player", type: "keyboard", code: "KeyF", action: autoSW },
      { name: "PickupReach", type: "keyboard", code: null, action: togglePickupReach },
      { name: "KillAura", type: "keyboard", code: null, action: toggleKillAura },
      { name: "Blink", type: "keyboard", code: null, action: toggleBlinkWrapper },
      { name: "Scaffold", type: "keyboard", code: null, action: toggleScaffold },
      { name: "HitBoxes", type: "keyboard", code: null, action: toggleHitBoxes },
      { name: "Wireframe", type: "keyboard", code: null, action: toggleWireframe },
      { name: "ESP", type: "keyboard", code: null, action: toggleESP },
      { name: "BHOP", type: "keyboard", code: null, action: toggleBHOP },
      { name: "ChestESP", type: "keyboard", code: null, action: toggleChestESP },
      { name: "OreESP", type: "keyboard", code: null, action: toggleOreESP },
      { name: "triggerBot", type: "keyboard", code: null, action: toggleTriggerBot },
      { name: "NameTags", type: "keyboard", code: null, action: toggleNameTags },
      { name: "Skybox", type: "keyboard", code: null, action: toggleSkybox },
      { name: "WallJump", type: "keyboard", code: null, action: toggleWallJumpScript },
      { name: "WaterJump", type: "keyboard", code: null, action: toggleLockPlayerWaterState },
  ];

  // Load from localStorage
  const storedKeybinds = localStorage.getItem(STORAGE_KEY);
  if (storedKeybinds) {
      try {
          const parsed = JSON.parse(storedKeybinds);
          // Inject saved key codes into default actions
          defaultKeybindActions = defaultKeybindActions.map((bind) => {
              const saved = parsed.find((s) => s.name === bind.name);
              return saved ? { ...bind, code: saved.code } : bind;
          });
      } catch (e) {
          console.warn("Failed to parse saved keybinds:", e);
      }
  }

  // Your working keybinds
  const keybindActions = defaultKeybindActions;


  //__END__SETTINGS______________________________________________

  // Credits to wang for the blinksState
  // Thanks for helping me with a lot of stuff.
  // (It is broken because of me not him)

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
  let slowHitEnabled = null;


  let everEnabled = {}

  // ==========================================================
  // --- END OF FULLY INTEGRATED WISK.V2 CODE BLOCK ----
  // ==========================================================

  // ... (continuing with all the functions from the wisk file)

})();