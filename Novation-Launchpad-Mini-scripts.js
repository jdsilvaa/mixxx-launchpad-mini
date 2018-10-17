/****************************************************************/
/*      Novation Launchpad Mini Mapping                         */
/*      For Mixxx version 1.12                                  */
/*      Author: jdsilvaa based on marczis and zestoi's work     */
/****************************************************************/

//Common helpers
colorCode = function()
{
    return {
        black: 4,

        lo_red: 1 + 4,
        mi_red: 2 + 4,
        hi_red: 3 + 4,
        lo_green: 16 + 4,
        mi_green: 32 + 4,
        hi_green: 48 + 4,
        lo_amber: 17 + 4,
        mi_amber: 34 + 4,
        hi_amber: 51 + 4,
        hi_orange: 35 + 4,
        lo_orange: 18 + 4,
        hi_yellow: 50 + 4,
        lo_yellow: 33 + 4,

    }
};
//Define one Key
Key = Object;
Key.prototype.color = colorCode("black");
Key.prototype.x = -1;
Key.prototype.y = -1;
Key.prototype.page = -1;
Key.prototype.pressed = false;

Key.prototype.init = function(page, x, y)
{
    this.x = x;
    this.y = y;
    this.page = page;
    //print("Key created");
}

Key.prototype.setColor = function(color)
{
    //First line is special
    this.color = colorCode()[color];
    this.draw();
};

Key.prototype.draw = function()
{
    if ( this.page != NLM.page ) return;
    if ( this.y == 8 ) {
        midi.sendShortMsg(0xb0, this.x + 0x68, this.color);
        return;
    }
    midi.sendShortMsg(0x90, this.x+this.y*16, this.color);
    //midi.sendShortMsg(0xb0, 0x0, 0x28); //Enable buffer cycling
}

Key.prototype.onPush = function()
{
}

Key.prototype.onRelease = function()
{
}

Key.prototype.callback = function()
{
    if (this.pressed) {
        this.onPush();
    } else {
        this.onRelease();
    }
}

function PushKey(colordef, colorpush) {
    var that = new Key;

    that.setColor(colordef);

    that.colordef = colordef;
    that.colorpush = colorpush;

    that.onPush = function()
    {
        this.setColor(this.colorpush);
    }

    that.onRelease = function()
    {
        this.setColor(this.colordef);
    }

    return that;
}

function PushKeyBin(colordef, colorpush, group, control, pushval) {
    var that = PushKey(colordef, colorpush);

    that.onPushOrig = that.onPush;
    that.onPush = function()
    {
        engine.setValue(group, control, pushval);
        this.onPushOrig();
    }
    return that;
}


function ToogleLibrary(ctrl) {
    var that = new Key();
    that.group = ctrl;
    that.ctrl  = "maximize_library";
    that.state = engine.getValue(this.group, "maximize_library");

    that.setled = function() {
        if (this.pressed) {
            this.setColor("hi_amber");
        } else if (engine.getValue(this.group, that.ctrl) == 1) {
            this.setColor("hi_green");
        } else {
            this.setColor("lo_yellow");
        }
    }

    that.conEvent = function() {
        engine.connectControl(this.group, this.state, this.setled);
    }

    that.setled();
    that.conEvent();

    that.onPush = function()
    {
        engine.setValue(this.group, this.ctrl, engine.getValue(this.group, this.ctrl) == 1 ? 0 : 1);
        this.setled();
    }

    that.onRelease = function()
    {
        this.setled();
    }

    return that;
}


function TooglePfl(ctrl, deck) {
    var that = new Key();
    that.group = "[" + ctrl + deck + "]";
    that.ctrl  = "pfl";
    that.state = engine.getValue(this.group, "pfl");

    that.setled = function() {
        if (this.pressed) {
            this.setColor("hi_amber");
        } else if (engine.getValue(this.group, that.ctrl) == 1) {
            this.setColor("hi_green");
        } else {
            this.setColor("lo_yellow");
        }
    }

    that.conEvent = function() {
        engine.connectControl(this.group, this.state, this.setled);
    }

    that.setled();
    that.conEvent();

    that.onPush = function()
    {
        engine.setValue(this.group, this.ctrl, engine.getValue(this.group, this.ctrl) == 1 ? 0 : 1);
        this.setled();
    }

    that.onRelease = function()
    {
        this.setled();
    }

    return that;
}


function PageSelectKey() {
    var that = new Key;

    that.onPush = function()
    {
        NLM.btns[NLM.page][8][NLM.page].setColor("black");
        NLM.page = this.y;
        NLM.btns[NLM.page][8][NLM.page].setColor("hi_amber");
        NLM.drawPage();
    }
    return that;
}

function ShiftKey() {
    var that = PushKey("lo_green", "hi_yellow");

    that.onPushOrig = that.onPush;
    that.onPush = function()
    {
        NLM.shiftstate = this.pressed;
        this.onPushOrig();
    }

    that.onReleaseOrig = that.onRelease;
    that.onRelease = function()
    {
        NLM.shiftstate = this.pressed;
        this.onReleaseOrig();
    }

    return that;
}

function HotCueKey(ctrl, deck, hotcue) {
    var that = new Key();
    that.deck = deck;
    that.hotcue = hotcue;

    that.group = "[" + ctrl + deck + "]";
    that.ctrl_act = "hotcue_" + hotcue + "_activate";
    that.ctrl_del = "hotcue_" + hotcue + "_clear";
    that.state   = "hotcue_" + hotcue + "_enabled";

    that.setled = function() {
        if (this.pressed) {
            this.setColor("hi_amber");
        } else if (engine.getValue(this.group, this.state) == 1) {
            this.setColor("hi_green");
        } else {
            this.setColor("lo_green");
        }
    }

    that.conEvent = function() {
        engine.connectControl(this.group, this.state, this.setled);
    }

    that.setled();
    that.conEvent();

    that.callback = function() {
        if (NLM.shiftstate) {
            ctrl = this.ctrl_del;
        } else {
            ctrl = this.ctrl_act;
        }

        if (this.pressed) {
            engine.setValue(this.group, ctrl, 1);
        } else {
            engine.setValue(this.group, ctrl, 0);
        }

        this.setled();
    }

    return that;
}

function FFBK(deck, ctrl, ffbk) {
  var that = new Key();
  that.deck = deck;
  that.group = "[" + ctrl + deck + "]";
  that.state = engine.getValue(this.group, ffbk);
  this.setColor("lo_green");

  that.setled = function() {
      if (this.pressed) {
          this.setColor("hi_red");
      } else {
          this.setColor("lo_orange");
      }
  }

  that.setled()

  that.callback = function() {
    if (this.pressed) {
      engine.setValue(this.group, ffbk, 1);
    } else {
      engine.setValue(this.group, ffbk, 0);
    }
    that.setled()
  }
  return that;
}

function PlayKey(ctrl, deck) {
    var that = new Key();
    that.group = "[" + ctrl + deck + "]";
    that.ctrl  = "play";
    that.state = "play_indicator";

    that.setled = function() {
        if (this.pressed) {
            this.setColor("hi_amber");
        } else if (engine.getValue(this.group, this.state) == 1) {
            this.setColor("hi_green");
        } else {
            this.setColor("hi_red");
        }
    }

    that.conEvent = function() {
        engine.connectControl(this.group, this.state, this.setled);
    }

    that.setled();
    that.conEvent();

    that.onPush = function()
    {
        engine.setValue(this.group, this.ctrl, engine.getValue(this.group, this.ctrl) == 1 ? 0 : 1);
        this.setled();
    }

    that.onRelease = function()
    {
        this.setled();
    }

    return that;
}

function LoopKey(deck, loop) {
    var that = new Key();

    that.group = "[Channel" + deck + "]";
    that.ctrl0 = "beatloop_" + loop + "_toggle";
    that.ctrl1 = "beatlooproll_" + loop + "_activate";
    that.state = "beatloop_" + loop + "_enabled";
    that.setColor("hi_yellow");

    if (LoopKey.keys == undefined) {
        LoopKey.keys = new Array;
        LoopKey.mode = 0;
    }

    LoopKey.setMode = function(mode)
    {
        LoopKey.mode = mode;
        if (mode == 1) {
            LoopKey.keys.forEach(function(e) { e.setColor("hi_orange");} );
        }
        if (mode == 0) {
            LoopKey.keys.forEach(function(e) { e.setColor("hi_yellow");} );
        }
    }

    that.callback = function()
    {
        if (LoopKey.mode == 0) {
             if (this.pressed) {
                engine.setValue(this.group, this.ctrl0, 1);
                this.setColor("hi_green");
            } else {
                if ( engine.getValue(this.group, this.state) == 1) {
                    engine.setValue(this.group, this.ctrl0, 1);
                }
                this.setColor("hi_yellow");
            }
        } else {
            if (this.pressed) {
                engine.setValue(this.group, this.ctrl1, 1);
                this.setColor("hi_green");
            } else {
                engine.setValue(this.group, this.ctrl1, 0);
                this.setColor("hi_orange");
            }
        }
    }

    LoopKey.keys.push(that);
    return that;
}

function LoopModeKey() {
    var that = new Key();
    that.setColor("lo_yellow");

    that.callback = function()
    {
        if (this.pressed) {
            if (LoopKey.mode == 0) {
                LoopKey.setMode(1);
                this.setColor("lo_orange");
            } else {
                LoopKey.setMode(0);
                this.setColor("lo_yellow");
            }
        }
    }

    return that;
}

function LoadKey(ctrl, channel) {
    var that = PushKey("hi_green","hi_amber");

    that.group   = "[" + ctrl + channel + "]";
    that.control = "LoadSelectedTrack";

    that.onPushOrig = that.onPush;

    that.onPush = function()
    {
        engine.setValue(this.group, this.control, 1);
        this.onPushOrig();
    }

    that.event = function() {
        if (engine.getValue(this.group, "play")) {
            this.colordef = "lo_red";
        } else {
            this.colordef = "hi_green";
        }
        this.setColor(this.colordef);
    }

    that.conEvent = function() {
        engine.connectControl(this.group, "play", this.event);
    }

    that.conEvent();
    return that;
}

function ZoomKey(dir) {
    var that = PushKey("lo_green", "hi_amber");

    that.dir  = dir;

    that.onPushOrig = that.onPush;
    that.onPush = function()
    {
        if ( ZoomKey.zoom < 6 && this.dir == "+" ) {
            ZoomKey.zoom++;
        }
        if ( ZoomKey.zoom > 1 && this.dir == "-") {
            ZoomKey.zoom--;
        }

        for ( ch = 1 ; ch <= NLM.numofdecks ; ch++ ) {
            //print("Zoom:" + ZoomKey.zoom);
            var group = "[Channel" + ch + "]";
            engine.setValue(group, "waveform_zoom", ZoomKey.zoom);
        }

        this.onPushOrig();
    }

    return that;
}
ZoomKey.zoom = 3;

function SeekKey(ch, pos) {
    var that = new Key();

    that.pos  = 0.07 * pos;
    that.grp = "[Channel"+ ch + "]";

    that.setled = function()
    {
        if (engine.getValue(this.grp, "playposition") >= this.pos) {
            this.setColor("lo_red");
        } else {
            this.setColor("black");
        }
    }

    that.conEvent = function()
    {
        engine.connectControl(this.grp, "beat_active", this.setled);
    }

    that.conEvent();

    that.onPush = function()
    {
        engine.setValue(this.grp, "playposition", this.pos);
        SeekKey.keys[ch].forEach(function(e) { e.setled(); });
    }

    that.setled();

    if ( SeekKey.keys[ch] == undefined ) SeekKey.keys[ch] = new Array();
    SeekKey.keys[ch][pos] = that;
    return that;
}
SeekKey.keys = new Array();

function SeekKeySampler(ch, pos) {
    var that = new Key();

    that.pos  = 0.125 * pos;
    that.grp = "[Sampler"+ ch + "]";

    that.setled = function()
    {
        if (engine.getValue(this.grp, "playposition") >= this.pos) {
            this.setColor("lo_red");
        } else {
            this.setColor("black");
        }
    }

    that.conEvent = function()
    {
        engine.connectControl(this.grp, "beat_active", this.setled);
    }

    that.conEvent();

    that.onPush = function()
    {
        engine.setValue(this.grp, "playposition", this.pos);
        SeekKeySampler.keys[ch].forEach(function(e) { e.setled(); });
    }

    that.setled();

    if ( SeekKeySampler.keys[ch] == undefined ) SeekKeySampler.keys[ch] = new Array();
    SeekKeySampler.keys[ch][pos] = that;
    return that;
}
SeekKeySampler.keys = new Array();

function SeekKey2(ch, pos, multiplier, color1, color2, param, check) {
    var that = new Key();

    that.pos  = multiplier * pos;
    that.grp = "[Channel"+ ch + "]";
    that.param = param;

    that.setled = function()
    {
        if (engine.getValue(this.grp, this.param) >= this.pos) {
            this.setColor(color1);
        } else {
            this.setColor(color2);
        }
    }

    that.onPush = function()
    {
        engine.setValue(this.grp, this.param, this.pos);
        SeekKey2.keys[check].forEach(function(e) { e.setled(); });
    }

    that.setled();

    if ( SeekKey2.keys[check] == undefined ) SeekKey2.keys[check] = new Array();
    SeekKey2.keys[check][pos] = that;
    return that;
}
SeekKey2.keys = new Array();

function SeekKeyEffect(pos, value, color1, color2, unit, effect, param, check) {
    var that = new Key();

    that.pos  = value;
    if (param == "mix") {
      that.grp = "[EffectRack1_EffectUnit"+unit+"]";
    } else {
      that.grp = "[EffectRack1_EffectUnit"+unit+"_Effect"+effect+"]";
    }
    that.param = param;

    that.setled = function()
    {
        if (engine.getValue(this.grp, param) >= this.pos) {
            this.setColor(color1);
        } else {
            this.setColor(color2);
        }
    }

    that.onPush = function()
    {
        engine.setValue(this.grp, param, this.pos);
        SeekKeyEffect.keys[check].forEach(function(e) { e.setled(); });
    }

    that.setled();

    if ( SeekKeyEffect.keys[check] == undefined ) SeekKeyEffect.keys[check] = new Array();
    SeekKeyEffect.keys[check][pos] = that;
    return that;
}
SeekKeyEffect.keys = new Array();

//Define the controller

NLM = new Controller();
NLM.init = function()
{
        NLM.page = 0;
        NLM.shiftstate = false;
        NLM.numofdecks = engine.getValue("[Master]", "num_decks");
        NLM.numofdecks = 2;

        //Init hw
        midi.sendShortMsg(0xb0, 0x0, 0x0);
        //midi.sendShortMsg(0xb0, 0x0, 0x28); //Enable buffer cycling <-- Figure out whats wrong with this

        // select buffer 0
        midi.sendShortMsg(0xb0, 0x68, 3);
        //midi.sendShortMsg(0xb0, 0x0, 0x31);
        //print("=============================");
        //Setup btnstate which is for phy. state
        NLM.btns = new Array();
        for ( page = 0; page < 8 ; page++ ) {
            NLM.btns[page] = new Array();
            for ( x = 0 ; x < 9 ; x++ ) {
                NLM.btns[page][x] = new Array();
                for ( y = 0 ; y < 9 ; y++ ) {
                    var tmp = new Key;
                    if (x == 8) {
                        tmp = PageSelectKey();
                    }
                    NLM.setupBtn(page,x,y, tmp);
                }
            }
        }
        //Set default page led
        NLM.btns[NLM.page][8][0].setColor("hi_amber");

        // =============== PAGE A ================
          page = 0;
          // ============ CHANNEL 1 ==============
              deck = 1;
              // PLAY
              NLM.setupBtn(page,0,0, PlayKey("Channel", deck));
              // PFL
              NLM.setupBtn(page,1,0, TooglePfl("Channel", deck));
              // FAST FORWARD
              NLM.setupBtn(page,3,1, FFBK(deck, "Channel", "fwd"));
              // FAST REWIND
              NLM.setupBtn(page,2,1, FFBK(deck, "Channel", "back"));
              // LOOP
              NLM.setupBtn(page,4,0, LoopKey(deck, "0.5"));
              NLM.setupBtn(page,5,0, LoopKey(deck, "1"));
              NLM.setupBtn(page,6,0, LoopKey(deck, "2"));
              NLM.setupBtn(page,7,0, LoopKey(deck, "4"));
              // HOT CUE
              NLM.setupBtn(page,4,1, HotCueKey("Channel", deck, 1));
              NLM.setupBtn(page,5,1, HotCueKey("Channel", deck, 2));
              NLM.setupBtn(page,6,1, HotCueKey("Channel", deck, 3));
              NLM.setupBtn(page,7,1, HotCueKey("Channel", deck, 4));
              // PROGRESSO
              NLM.setupBtn(page,0,2, SeekKey(deck, 0));
              NLM.setupBtn(page,1,2, SeekKey(deck, 1));
              NLM.setupBtn(page,2,2, SeekKey(deck, 2));
              NLM.setupBtn(page,3,2, SeekKey(deck, 3));
              NLM.setupBtn(page,4,2, SeekKey(deck, 4));
              NLM.setupBtn(page,5,2, SeekKey(deck, 5));
              NLM.setupBtn(page,6,2, SeekKey(deck, 6));
              NLM.setupBtn(page,7,2, SeekKey(deck, 7));
              NLM.setupBtn(page,0,3, SeekKey(deck, 15));
              NLM.setupBtn(page,1,3, SeekKey(deck, 14));
              NLM.setupBtn(page,2,3, SeekKey(deck, 13));
              NLM.setupBtn(page,3,3, SeekKey(deck, 12));
              NLM.setupBtn(page,4,3, SeekKey(deck, 11));
              NLM.setupBtn(page,5,3, SeekKey(deck, 10));
              NLM.setupBtn(page,6,3, SeekKey(deck, 9));
              NLM.setupBtn(page,7,3, SeekKey(deck, 8));
          // =====================================
          // ============ CHANNEL 2 ==============
            deck = 2;
            // PLAY
            NLM.setupBtn(page,0,4, PlayKey("Channel", deck));
            // PFL
            NLM.setupBtn(page,1,4, TooglePfl("Channel", deck));
            // FAST FORWARD
            NLM.setupBtn(page,3,5, FFBK(deck, "Channel", "fwd"));
            // FAST REWIND
            NLM.setupBtn(page,2,5, FFBK(deck, "Channel", "back"));
            // LOOP
            NLM.setupBtn(page,4,4, LoopKey(deck, "0.5"));
            NLM.setupBtn(page,5,4, LoopKey(deck, "1"));
            NLM.setupBtn(page,6,4, LoopKey(deck, "2"));
            NLM.setupBtn(page,7,4, LoopKey(deck, "4"));
            // HOT CUE
            NLM.setupBtn(page,4,5, HotCueKey("Channel", deck, 1));
            NLM.setupBtn(page,5,5, HotCueKey("Channel", deck, 2));
            NLM.setupBtn(page,6,5, HotCueKey("Channel", deck, 3));
            NLM.setupBtn(page,7,5, HotCueKey("Channel", deck, 4));
            // PROGRESSO
            NLM.setupBtn(page,0,6, SeekKey(deck, 0));
            NLM.setupBtn(page,1,6, SeekKey(deck, 1));
            NLM.setupBtn(page,2,6, SeekKey(deck, 2));
            NLM.setupBtn(page,3,6, SeekKey(deck, 3));
            NLM.setupBtn(page,4,6, SeekKey(deck, 4));
            NLM.setupBtn(page,5,6, SeekKey(deck, 5));
            NLM.setupBtn(page,6,6, SeekKey(deck, 6));
            NLM.setupBtn(page,7,6, SeekKey(deck, 7));
            NLM.setupBtn(page,0,7, SeekKey(deck, 15));
            NLM.setupBtn(page,1,7, SeekKey(deck, 14));
            NLM.setupBtn(page,2,7, SeekKey(deck, 13));
            NLM.setupBtn(page,3,7, SeekKey(deck, 12));
            NLM.setupBtn(page,4,7, SeekKey(deck, 11));
            NLM.setupBtn(page,5,7, SeekKey(deck, 10));
            NLM.setupBtn(page,6,7, SeekKey(deck, 9));
            NLM.setupBtn(page,7,7, SeekKey(deck, 8));
          // ========================================
          // ============== CONTROLOS ===============
            // ZOOM
            NLM.setupBtn(page,0,8, ZoomKey("-"));
            NLM.setupBtn(page,1,8, ZoomKey("+"));
            // SHIFT
            NLM.setupBtn(page,7,8, ShiftKey());
          // ========================================
        // ==========================================
        // ================ PAGE B ==================
          page = 1;
          // ============ CHANNEL 1 ==============
            deck = 1;
            // PREGAIN
            NLM.setupBtn(page,0,7, SeekKey2(deck, 0, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,6, SeekKey2(deck, 1, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,5, SeekKey2(deck, 2, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,4, SeekKey2(deck, 3, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,3, SeekKey2(deck, 4, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,2, SeekKey2(deck, 5, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,1, SeekKey2(deck, 6, 0.33, "hi_red", "black", "pregain", 1));
            NLM.setupBtn(page,0,0, SeekKey2(deck, 7, 0.33, "hi_red", "black", "pregain", 1));
            // FILTER HIGH
            NLM.setupBtn(page,1,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterHigh", 2));
            NLM.setupBtn(page,1,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterHigh", 2));
            // FILTER MID
            NLM.setupBtn(page,2,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterMid", 3));
            NLM.setupBtn(page,2,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterMid", 3));
            // FILTER LOW
            NLM.setupBtn(page,3,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterLow", 4));
            NLM.setupBtn(page,3,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterLow", 4));
          // ========================================
          // ============== CHANNEL 2 ===============
            deck = 2;
            // PREGAIN
            NLM.setupBtn(page,4,7, SeekKey2(deck, 0, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,6, SeekKey2(deck, 1, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,5, SeekKey2(deck, 2, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,4, SeekKey2(deck, 3, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,3, SeekKey2(deck, 4, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,2, SeekKey2(deck, 5, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,1, SeekKey2(deck, 6, 0.33, "hi_red", "black", "pregain", 5));
            NLM.setupBtn(page,4,0, SeekKey2(deck, 7, 0.33, "hi_red", "black", "pregain", 5));
            // FILTER HIGH
            NLM.setupBtn(page,5,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterHigh", 6));
            NLM.setupBtn(page,5,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterHigh", 6));
            // FILTER MID
            NLM.setupBtn(page,6,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterMid", 7));
            NLM.setupBtn(page,6,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterMid", 7));
            // FILTER LOW
            NLM.setupBtn(page,7,7, SeekKey2(deck, 0, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,6, SeekKey2(deck, 1, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,5, SeekKey2(deck, 2, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,4, SeekKey2(deck, 3, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,3, SeekKey2(deck, 4, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,2, SeekKey2(deck, 5, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,1, SeekKey2(deck, 6, 0.33, "hi_yellow", "black", "filterLow", 8));
            NLM.setupBtn(page,7,0, SeekKey2(deck, 7, 0.33, "hi_yellow", "black", "filterLow", 8));
          // ========================================
        // ==========================================
        // ================ PAGE C ==================
          page = 2;
          // ============ CHANNEL 1 ==============
            deck = 1;
            // VOLUME
            NLM.setupBtn(page,3,7, SeekKey2(deck, 0, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,6, SeekKey2(deck, 1, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,5, SeekKey2(deck, 2, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,4, SeekKey2(deck, 3, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,3, SeekKey2(deck, 4, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,2, SeekKey2(deck, 5, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,1, SeekKey2(deck, 6, 0.12, "hi_red", "lo_green", "volume", 9));
            NLM.setupBtn(page,3,0, SeekKey2(deck, 7, 0.12, "hi_red", "lo_green", "volume", 9));
          // =====================================
          // ============ CHANNEL 2 ==============
            deck = 2;
            // VOLUME
            NLM.setupBtn(page,4,7, SeekKey2(deck, 0, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,6, SeekKey2(deck, 1, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,5, SeekKey2(deck, 2, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,4, SeekKey2(deck, 3, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,3, SeekKey2(deck, 4, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,2, SeekKey2(deck, 5, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,1, SeekKey2(deck, 6, 0.12, "hi_red", "lo_green", "volume", 10));
            NLM.setupBtn(page,4,0, SeekKey2(deck, 7, 0.12, "hi_red", "lo_green", "volume", 10));
          // =====================================
        // ==========================================
        // ================ PAGE D ==================
          page = 3;
          // ============= FILTERS ===============
            // FLANGER
            // pos, value, color1, color2, unit, effect, param, check
            NLM.setupBtn(page,0,7, SeekKeyEffect(0, 0, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,6, SeekKeyEffect(1, 0.125, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,5, SeekKeyEffect(2, 0.25, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,4, SeekKeyEffect(3, 0.375, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,3, SeekKeyEffect(4, 0.5, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,2, SeekKeyEffect(5, 0.625, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,1, SeekKeyEffect(6, 0.75, "hi_red", "black", 1, 1, "parameter1", 1));
            NLM.setupBtn(page,0,0, SeekKeyEffect(7, 1, "hi_red", "black", 1, 1, "parameter1", 1));
            // FILTER 1
            // pos, value, color1, color2, unit, effect, param, check
            NLM.setupBtn(page,2,7, SeekKeyEffect(0, 0.003, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,6, SeekKeyEffect(1, 0.009, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,5, SeekKeyEffect(2, 0.015, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,4, SeekKeyEffect(3, 0.02, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,3, SeekKeyEffect(4, 0.03, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,2, SeekKeyEffect(5, 0.2, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,1, SeekKeyEffect(6, 0.3, "hi_yellow", "black", 2, 1, "parameter1", 2));
            NLM.setupBtn(page,2,0, SeekKeyEffect(7, 0.5, "hi_yellow", "black", 2, 1, "parameter1", 2));
            // FILTER 2
            // pos, value, color1, color2, unit, effect, param, check
            NLM.setupBtn(page,3,7, SeekKeyEffect(0, 0.003, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,6, SeekKeyEffect(1, 0.009, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,5, SeekKeyEffect(2, 0.015, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,4, SeekKeyEffect(3, 0.02, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,3, SeekKeyEffect(4, 0.025, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,2, SeekKeyEffect(5, 0.03, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,1, SeekKeyEffect(6, 0.04, "hi_red", "black", 2, 1, "parameter3", 3));
            NLM.setupBtn(page,3,0, SeekKeyEffect(7, 0.05, "hi_red", "black", 2, 1, "parameter3", 3));
            // BIT CRUSHER
            // pos, value, color1, color2, unit, effect, param, check
            NLM.setupBtn(page,5,7, SeekKeyEffect(0, 0.02, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,6, SeekKeyEffect(1, 0.04, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,5, SeekKeyEffect(2, 0.06, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,4, SeekKeyEffect(3, 0.1, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,3, SeekKeyEffect(4, 0.2, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,2, SeekKeyEffect(5, 0.4, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,1, SeekKeyEffect(6, 0.75, "hi_yellow", "black", 3, 1, "parameter2", 4));
            NLM.setupBtn(page,5,0, SeekKeyEffect(7, 1, "hi_yellow", "black", 3, 1, "parameter2", 4));
            // REVERB
            // pos, value, color1, color2, unit, effect, param, check
            NLM.setupBtn(page,7,7, SeekKeyEffect(0, 0, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,6, SeekKeyEffect(1, 0.125, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,5, SeekKeyEffect(2, 0.25, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,4, SeekKeyEffect(3, 0.375, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,3, SeekKeyEffect(4, 0.5, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,2, SeekKeyEffect(5, 0.625, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,1, SeekKeyEffect(6, 0.75, "hi_red", "black", 4, 1, "mix", 5));
            NLM.setupBtn(page,7,0, SeekKeyEffect(7, 1, "hi_red", "black", 4, 1, "mix", 5));
          // =====================================
        // ==========================================
        // ================ PAGE E ==================
          page = 4;
            // =========== SAMPLER 1 ==============
              channel = 1;
              // PLAY
              NLM.setupBtn(page, 0, 0, PlayKey("Sampler", channel));
              // PFL
              NLM.setupBtn(page,1,0, TooglePfl("Sampler", channel));
              // HOT CUE
              NLM.setupBtn(page, 4, 0, HotCueKey("Sampler", channel, 1));
              NLM.setupBtn(page, 5, 0, HotCueKey("Sampler", channel, 2));
              NLM.setupBtn(page, 6, 0, HotCueKey("Sampler", channel, 3));
              NLM.setupBtn(page, 7, 0, HotCueKey("Sampler", channel, 4));
              // PROGRESSO
              NLM.setupBtn(page,0,1, SeekKeySampler(channel, 0));
              NLM.setupBtn(page,1,1, SeekKeySampler(channel, 1));
              NLM.setupBtn(page,2,1, SeekKeySampler(channel, 2));
              NLM.setupBtn(page,3,1, SeekKeySampler(channel, 3));
              NLM.setupBtn(page,4,1, SeekKeySampler(channel, 4));
              NLM.setupBtn(page,5,1, SeekKeySampler(channel, 5));
              NLM.setupBtn(page,6,1, SeekKeySampler(channel, 6));
              NLM.setupBtn(page,7,1, SeekKeySampler(channel, 7));
            // ====================================
            // =========== SAMPLER 2 ==============
              channel = 2;
              // PLAY
              NLM.setupBtn(page, 0, 2, PlayKey("Sampler", channel));
              // PFL
              NLM.setupBtn(page,1,2, TooglePfl("Sampler", channel));
              // HOT CUE
              NLM.setupBtn(page, 4, 2, HotCueKey("Sampler", channel, 1));
              NLM.setupBtn(page, 5, 2, HotCueKey("Sampler", channel, 2));
              NLM.setupBtn(page, 6, 2, HotCueKey("Sampler", channel, 3));
              NLM.setupBtn(page, 7, 2, HotCueKey("Sampler", channel, 4));
              // PROGRESSO
              NLM.setupBtn(page,0,3, SeekKeySampler(channel, 0));
              NLM.setupBtn(page,1,3, SeekKeySampler(channel, 1));
              NLM.setupBtn(page,2,3, SeekKeySampler(channel, 2));
              NLM.setupBtn(page,3,3, SeekKeySampler(channel, 3));
              NLM.setupBtn(page,4,3, SeekKeySampler(channel, 4));
              NLM.setupBtn(page,5,3, SeekKeySampler(channel, 5));
              NLM.setupBtn(page,6,3, SeekKeySampler(channel, 6));
              NLM.setupBtn(page,7,3, SeekKeySampler(channel, 7));
            // ====================================
            // =========== SAMPLER 3 ==============
              channel = 3;
              // PLAY
              NLM.setupBtn(page, 0, 4, PlayKey("Sampler", channel));
              // PFL
              NLM.setupBtn(page,1,4, TooglePfl("Sampler", channel));
              // HOT CUE
              NLM.setupBtn(page, 4, 4, HotCueKey("Sampler", channel, 1));
              NLM.setupBtn(page, 5, 4, HotCueKey("Sampler", channel, 2));
              NLM.setupBtn(page, 6, 4, HotCueKey("Sampler", channel, 3));
              NLM.setupBtn(page, 7, 4, HotCueKey("Sampler", channel, 4));
              // PROGRESSO
              NLM.setupBtn(page,0,5, SeekKeySampler(channel, 0));
              NLM.setupBtn(page,1,5, SeekKeySampler(channel, 1));
              NLM.setupBtn(page,2,5, SeekKeySampler(channel, 2));
              NLM.setupBtn(page,3,5, SeekKeySampler(channel, 3));
              NLM.setupBtn(page,4,5, SeekKeySampler(channel, 4));
              NLM.setupBtn(page,5,5, SeekKeySampler(channel, 5));
              NLM.setupBtn(page,6,5, SeekKeySampler(channel, 6));
              NLM.setupBtn(page,7,5, SeekKeySampler(channel, 7));
            // ====================================
            // =========== SAMPLER 4 ==============
              channel = 4;
              // PLAY
              NLM.setupBtn(page, 0, 6, PlayKey("Sampler", channel));
              // PFL
              NLM.setupBtn(page,1,6, TooglePfl("Sampler", channel));
              // HOT CUE
              NLM.setupBtn(page, 4, 6, HotCueKey("Sampler", channel, 1));
              NLM.setupBtn(page, 5, 6, HotCueKey("Sampler", channel, 2));
              NLM.setupBtn(page, 6, 6, HotCueKey("Sampler", channel, 3));
              NLM.setupBtn(page, 7, 6, HotCueKey("Sampler", channel, 4));
              // PROGRESSO
              NLM.setupBtn(page,0,7, SeekKeySampler(channel, 0));
              NLM.setupBtn(page,1,7, SeekKeySampler(channel, 1));
              NLM.setupBtn(page,2,7, SeekKeySampler(channel, 2));
              NLM.setupBtn(page,3,7, SeekKeySampler(channel, 3));
              NLM.setupBtn(page,4,7, SeekKeySampler(channel, 4));
              NLM.setupBtn(page,5,7, SeekKeySampler(channel, 5));
              NLM.setupBtn(page,6,7, SeekKeySampler(channel, 6));
              NLM.setupBtn(page,7,7, SeekKeySampler(channel, 7));
            // ====================================
          // ============== CONTROLOS ===============
            // SHIFT
            NLM.setupBtn(page,7,8, ShiftKey());
          // ========================================
        // ==========================================
        // ================ PAGE H ==================
          page = 7;
          // ============== CONTROLOS ===============
            // Right side, playlist scroll
            NLM.setupBtn(page,6,2, PushKeyBin("lo_amber", "hi_amber", "[Playlist]", "SelectTrackKnob", -50));
            NLM.setupBtn(page,7,2, PushKeyBin("lo_amber", "hi_amber", "[Playlist]", "SelectTrackKnob", 50));

            NLM.setupBtn(page,6,1, PushKeyBin("mi_amber", "hi_amber", "[Playlist]", "SelectTrackKnob", -10));
            NLM.setupBtn(page,7,1, PushKeyBin("mi_amber", "hi_amber", "[Playlist]", "SelectTrackKnob", 10));

            NLM.setupBtn(page,6,0, PushKeyBin("hi_amber", "hi_amber", "[Playlist]", "SelectPrevTrack", 1));
            NLM.setupBtn(page,7,0, PushKeyBin("hi_amber", "hi_amber", "[Playlist]", "SelectNextTrack", 1));

            NLM.setupBtn(page,6,5, LoadKey("Channel",1));
            NLM.setupBtn(page,7,5, LoadKey("Channel",2));

            NLM.setupBtn(page,4,7, LoadKey("Sampler",1));
            NLM.setupBtn(page,5,7, LoadKey("Sampler",2));
            NLM.setupBtn(page,6,7, LoadKey("Sampler",3));
            NLM.setupBtn(page,7,7, LoadKey("Sampler",4));

            // Left side, playlists
            NLM.setupBtn(page,4,0, PushKeyBin("hi_green", "hi_amber", "[Playlist]", "SelectPrevPlaylist", 1));
            NLM.setupBtn(page,4,1, PushKeyBin("hi_yellow", "hi_amber", "[Playlist]", "ToggleSelectedSidebarItem", 1));
            NLM.setupBtn(page,4,2, PushKeyBin("hi_green", "hi_amber", "[Playlist]", "SelectNextPlaylist", 1));

            // Maximize Library
            NLM.setupBtn(page,7,8, ToogleLibrary("[Master]"));
          // =========================================
        // ===========================================
        this.drawPage();
};

NLM.setupBtn = function(page, x, y, btn)
{
    NLM.btns[page][x][y] = btn;
    NLM.btns[page][x][y].init(page, x, y);
}

NLM.shutdown = function()
{

};

NLM.incomingData = function(channel, control, value, status, group)
{
        //print("Incoming data");
        //print("cha: " + channel);
        //print("con: " + control);
        //print("val: " + value);
        //print("sta: " + status);
        //print("grp: " + group);

        //Just to make life easier

        var pressed = (value == 127);
        //Translate midi btn into index
        var y = Math.floor(control / 16);
        var x = control - y * 16;
        if ( y == 6 && x > 8 ) {
            y = 8;
            x -= 8;
        }
        if ( y == 6 && x == 8 && status == 176 ) {
            y = 8; x = 0;
        }

        print( "COO: " + NLM.page + ":" + x + ":" + y);
        NLM.btns[NLM.page][x][y].pressed = pressed;
        NLM.btns[NLM.page][x][y].callback();
};

NLM.drawPage = function() {
    for ( x = 0 ; x < 9 ; x++ ) {
        for ( y = 0 ; y < 9 ; y++ ) {
            NLM.btns[NLM.page][x][y].draw();
        }
    }
}
