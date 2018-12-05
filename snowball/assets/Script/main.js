var qianqista = require("qianqista");
cc.Class({
    extends: cc.Component,

    properties: {
        shu1: {
            default: null,
            type: cc.Prefab
        },
        shu2: {
            default: null,
            type: cc.Prefab
        },
        shu3: {
            default: null,
            type: cc.Prefab
        },
        obs1: {
            default: null,
            type: cc.Prefab
        },
        obs2: {
            default: null,
            type: cc.Prefab
        },
        obs3: {
            default: null,
            type: cc.Prefab
        },
        bird: {
            default: null,
            type: cc.Prefab
        },
        audio_get: {
            type: cc.AudioClip,
            default: null
        },
        audio_bird: {
            type: cc.AudioClip,
            default: null
        },
        audio_dead: {
            type: cc.AudioClip,
            default: null
        },
        audio_jump: {
            type: cc.AudioClip,
            default: null
        },
        audio_throw: {
            type: cc.AudioClip,
            default: null
        },
        audio_music: {
            type: cc.AudioClip,
            default: null
        },
        display: cc.Sprite,
        display_gray: cc.Node,
        display_gray_rank: cc.Node,
        display_bg: cc.Node
    },




    // use this for initialization
    onLoad: function () {
        this.dsize = cc.view.getDesignResolutionSize();
        this.tex = new cc.Texture2D();
        this.subdt = 0;
        this.userInfo = {};
        this.uploadScoreDt = 0;
        this.openover = false;
        this.NetConfig= [];

        this.initData();
        this.initUI();
        this.addListener();
        this.adapt();

        cc.audioEngine.play(this.audio_music, true, 0.5);

        var self = this;
        qianqista.init("100000145","ec0a5e32eaa79dc3069890a9337341de","奔跑吧雪球-vivo",function(){
            qianqista.datas(function(res){
                console.log('my datas:', res);
                if(res.state == 200)
                {
                    self.updateLocalData(res.data);
                }
            });
        });
        qianqista.control(function(res){
            console.log('my control:', res);
            if(res.state == 200)
            {
                self.NetConfig = res.data;
                self.updateUIControl();
            }
        });

        //this.wxGetUserInfo();
        //this.wxOpenQuan();
        //this.wxVideoLoad();
    },


    wxGetUserInfo: function()
    {
        var self = this;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            wx.login({
                success: function () {
                    wx.getUserInfo({
                        openIdList:['selfOpenId'],
                        lang: 'zh_CN',
                        fail: function (res) {
                            // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
                            if (res.errMsg.indexOf('auth deny') > -1 ||     res.errMsg.indexOf('auth denied') > -1 ) {
                                // 处理用户拒绝授权的情况
                                cc.log(res.errMsg);
                                self.wxOpenSetting();
                                qianqista.login(false);
                            }
                        },
                        success: function(res)
                        {
                            cc.log(res.userInfo);
                            self.userInfo = res.userInfo;
                            qianqista.login(true,res.userInfo);
                            wx.postMessage({ message: "loginSuccess",userInfo:res.userInfo });
                        }
                    });
                }
            });

            wx.showShareMenu({
                withShareTicket: true,
                success: function (res) {
                    qianqista.share(true);
                    cc.log(res);
                },
                fail: function (res) {
                    qianqista.share(false);
                }
            });

            wx.onShareAppMessage(function (ops){
                return {
                    query:"channel=sharemenu",
                    title: "你一定撑不过10秒，不信试试~",
                    imageUrl: cc.url.raw("resources/zhuanfa.jpg")
                }
            });

            wx.updateShareMenu({
                withShareTicket: true,
                success: function (res) {
                    // 分享成功
                    qianqista.share(true);
                },
                fail: function (res) {
                    // 分享失败
                    qianqista.share(false);
                }
            })
        }
        
    },

    wxOpenSetting: function()
    {
        var self = this;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            self.node_quanxian.active = true;
            var openDataContext = wx.getOpenDataContext();
            var sharedCanvas = openDataContext.canvas;
            var button = wx.createOpenSettingButton({
                type: 'text',
                text: '打开设置页面',
                style: {
                    left: sharedCanvas.width/4-50,
                    top: sharedCanvas.height/4+30,
                    width: 100,
                    height: 30,
                    lineHeight: 30,
                    backgroundColor: '#1779a6',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 12,
                    borderRadius: 4
                }
            });
            button.onTap(function(){
                wx.getSetting({
                    success: function (res) {
                        var authSetting = res.authSetting;
                        button.destroy();
                        self.node_quanxian.active = false;
                        if (authSetting['scope.userInfo'] === true) {
                            wx.getUserInfo({
                                openIdList:['selfOpenId'],
                                lang: 'zh_CN',
                                fail: function (res) {
                                    // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
                                    if (res.errMsg.indexOf('auth deny') > -1 ||     res.errMsg.indexOf('auth denied') > -1 ) {
                                        // 处理用户拒绝授权的情况
                                        cc.log(res.errMsg);
                                        qianqista.login(false);
                                        self.wxOpenSetting();
                                    }

                                },
                                success: function(res)
                                {
                                    cc.log(res.userInfo);
                                    self.userInfo = res.userInfo;
                                    qianqista.login(true,res.userInfo);
                                    wx.postMessage({ message: "loginSuccess",userInfo:res.userInfo });
                                }
                            });
                        } else if (authSetting['scope.userInfo'] === false){
                            // 用户已拒绝授权，再调用相关 API 或者 wx.authorize 会失败，需要引导用户到设置页面打开授权开关
                            self.wxOpenSetting();
                        } else {
                            // 未询问过用户授权，调用相关 API 或者 wx.authorize 会弹窗询问用户
                        }
                    }
                });
            });
        }
        
    },

    _updaetSubDomainCanvas: function() {
        if (!this.tex) {
            return;
        }
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            var openDataContext = wx.getOpenDataContext();
            var sharedCanvas = openDataContext.canvas;
            this.tex.initWithElement(sharedCanvas);
            this.tex.handleLoadedTexture();
            this.display.spriteFrame = new cc.SpriteFrame(this.tex);
            if(this.display.node.scale == 1)
                this.display.node.scale = (this.dsize.width / this.display.node.width);
        }
    },

    wxOpenQuan: function()
    {
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            var openDataContext = wx.getOpenDataContext();
            var sharedCanvas = openDataContext.canvas;
            var quan = cc.find("bootembg/quan",this.GU.main_bg);
            var sc = sharedCanvas.width/this.dsize.width;
            var dpi = cc.view._devicePixelRatio;
            var pos = cc.v2(quan.x*sc/dpi,sharedCanvas.height/dpi-quan.y*sc/dpi);
            this.quan_button = wx.createGameClubButton({
                icon: 'white',
                style: {
                    left: pos.x - 15,
                    top: pos.y - 15,
                    width: 30,
                    height: 30
                }
            })
        }
        
    },

    wxQuanActive: function(active)
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //{
        //    if(active)
        //        this.quan_button.show();
        //    else
        //        this.quan_button.hide();
        //}
    },

    adapt: function()
    {
        var nodes = [this.GU.game_bg,this.GU.main_bg,this.GU.pause_bg,this.GU.over_bg,this.GU.fuhuo_bg,this.GU.fuhuocard_bg];
        for(var i=0;i<nodes.length;i++)
        {
            var items = nodes[i].children;
            for(var j=0;j<items.length;j++)
            {
                var item = items[j];
                this.adaptItem(item);
            }
        }
    },

    adaptItem: function(node)
    {
        var s = cc.winSize;
        var h = (this.dsize.height - s.height)/2;
        var sc = node.y/this.dsize.height;
        node.y = s.height*sc + h;
    },

    initData: function()
    {
        this.GAMENAME = 'XQG';
        this.GU = {};
        this.GAME = {};

        this.GAME.state = "MAIN";
        this.GAME.Configs = {
            "PlayerHp":3,
            "Size":[0.3,1.3,100],
            "Rotate":[200,400,120],//    (400-200)/100=旋转速度   每帧增加
            "LevelInfo":[
                {"Time":20,//             这关的总时间
                    "OTime":4,//           每4秒出现障碍物
                    "OBird":[8],//           0代表不出鸟，其他数代表出鸟的时间
                    "ORate":[1,0,0]
                },
                {
                    "Time":20,
                    "OTime":4,
                    "OBird":[4],
                    "ORate":[3,2,1]
                },
                {
                    "Time":20,
                    "OTime":3,
                    "OBird":[],
                    "ORate":[4,2,0]
                },
                {
                    "Time":20,
                    "OTime":3,
                    "OBird":[4],
                    "ORate":[6,3,1]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[],
                    "ORate":[7,3,0]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[10],
                    "ORate":[8,4,1]
                },
                {
                    "Time":20,
                    "OTime":3,
                    "OBird":[],
                    "ORate":[2,1,0]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[6],
                    "ORate":[3,2,1]
                },
                {
                    "Time":10,
                    "OTime":1,
                    "OBird":[],
                    "ORate":[1,0,0]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[7],
                    "ORate":[3,2,1]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[],
                    "ORate":[3,1,0]
                },
                {
                    "Time":20,
                    "OTime":1,
                    "OBird":[],
                    "ORate":[1,2,0]
                },
                {
                    "Time":20,
                    "OTime":2,
                    "OBird":[6],
                    "ORate":[3,0,0]
                },
                {
                    "Time":20,
                    "OTime":3,
                    "OBird":[],
                    "ORate":[3,1,1]
                },
                {
                    "Time":30,
                    "OTime":1,
                    "OBird":[],
                    "ORate":[2,2,1]
                }
            ]
        };

        this.resetData();
    },

    initUI: function()
    {
        this.GAME.bg = cc.find("Canvas/node_bg");
        var san1_3 = cc.find("Canvas/node_bg/san1_3");
        var san1_4 = cc.find("Canvas/node_bg/san1_4");
        var fx = parseInt(Math.random()*720);
        san1_3.x = fx;
        san1_4.x = fx-san1_3.width;

        var san1_1 = cc.find("Canvas/node_bg/san1_1");
        var san1_2 = cc.find("Canvas/node_bg/san1_2");
        var san2_1 = cc.find("Canvas/node_bg/san2_1");
        var san2_2 = cc.find("Canvas/node_bg/san2_2");
        this.GAME.sans = [
            [san1_1,san1_2,20],
            [san1_3,san1_4,25],
            [san2_1,san2_2,10]
        ];

        this.GAME.yunContainer = cc.find("Canvas/node_bg/yunContainer");
        for(var i = 1;i < 6;i++)
        {
            var x = Math.floor(Math.random()*(cc.winSize.width+100)-50);
            var y = Math.floor(Math.random()*cc.winSize.height*0.9+cc.winSize.height*0.6);
            var s = Math.floor(Math.random()*50+30);

            var yun = cc.find("yun_"+i,this.GAME.yunContainer);
            yun.x = x;
            yun.y = y;
            yun.speed = s;
        }

        this.GAME.po1 = cc.find("Canvas/node_bg/po1");
        this.GAME.po2 = cc.find("Canvas/node_bg/po2");

        var angle = 195*Math.PI/180;
        var vec = cc.v2(Math.cos(angle),Math.sin(angle));
        this.GAME.rVec = vec.mul(949-122);

        this.GAME.treeContainer = cc.find("Canvas/node_bg/treeContainer");
        this.GAME.ballNode = cc.find("Canvas/node_bg/ballNode");
        this.GAME.ballNode.ball = cc.find("ball",this.GAME.ballNode);
        this.GAME.ballNode.ball2 = cc.find("ball2",this.GAME.ballNode);

        this.GAME.ballNode.scale = this.GAME.size;

        this.GAME.tempObsContainer = cc.find("Canvas/node_bg/tempObsContainer");
        this.GAME.player = cc.find("Canvas/node_bg/player");
        this.GAME.player.x = cc.winSize.width/2;
        this.GAME.player.y = 437+373*this.GAME.size-5;


        this.GU.game_bg = cc.find("Canvas/ui_bg/game_bg");
        this.GU.selfScore = cc.find("Canvas/ui_bg/game_bg/selfScore");
        this.GU.selfScore.getComponent("cc.Label").string = "0";
        this.GU.game_bg.active = false;

        this.GU.main_bg = cc.find("Canvas/ui_bg/main_bg");
        this.GU.main_bg.score = cc.find("score",this.GU.main_bg);
        this.GU.main_bg.more = cc.find("more",this.GU.main_bg);
        this.GU.main_bg.gunicon = cc.find("gunicon",this.GU.main_bg);
        this.GU.main_bg.gunicon.runAction(cc.repeatForever(cc.sequence(
            cc.rotateBy(0.1,15).easing(cc.easeSineIn()),
            cc.rotateBy(0.1,-15).easing(cc.easeSineIn()),
            cc.delayTime(2)
        )));

        var currscore = cc.sys.localStorage.getItem("highscore");
        currscore = currscore ? currscore : 0;
        this.GU.main_bg.score.getComponent("cc.Label").string = currscore+"";

        this.GU.pause_bg = cc.find("Canvas/ui_bg/pause_bg");
        this.node_pause_tishi = cc.find("tishi",this.GU.pause_bg);
        this.node_pause_hand = cc.find("hand",this.GU.pause_bg);
        this.GU.over_bg = cc.find("Canvas/ui_bg/over_bg");
        this.GU.over_bg.score = cc.find("score",this.GU.over_bg);
        this.GU.over_bg.more = cc.find("more",this.GU.over_bg);
        this.GU.over_bg.gunicon = cc.find("gunicon",this.GU.over_bg);
        this.GU.over_bg.gunicon.runAction(cc.repeatForever(cc.sequence(
            cc.rotateBy(0.1,15).easing(cc.easeSineIn()),
            cc.rotateBy(0.1,-15).easing(cc.easeSineIn()),
            cc.delayTime(2)
        )));

        this.GU.fuhuo_bg = cc.find("Canvas/ui_bg/fuhuo_bg");
        this.GU.fuhuo_bg.score = cc.find("score",this.GU.fuhuo_bg);
        this.GU.node_fuhuo_fu_card = cc.find("bg/bg/card",this.GU.fuhuo_bg);
        this.GU.node_fuhuo_fu_video = cc.find("bg/bg/vedio",this.GU.fuhuo_bg);
        // this.GU.fuhuo_bg.cardnum = cc.find("fuhuo/cardnum",this.GU.fuhuo_bg);
        // this.GU.fuhuo_bg.skip = cc.find("skip",this.GU.fuhuo_bg);

        this.GU.paihang_bg = cc.find("Canvas/ui_bg/paihang_bg");

        this.GU.card_bg = cc.find("Canvas/ui_bg/card_bg");
        this.node_card_num = cc.find("card_box/bg/cardnum",this.GU.card_bg);

        this.GU.fuhuocard_bg = cc.find("Canvas/ui_bg/fuhuocard_bg");
        this.node_fuhuocard_num = cc.find("card_box/bg/cardnum",this.GU.fuhuocard_bg);
        this.node_fuhuocard_fuhuo_usecard = cc.find("card_box/bg/fuhuo_usecard",this.GU.fuhuocard_bg);

        this.node_quanxian = cc.find("Canvas/node_quanxian");

        this.GU.yindao_bg = cc.find("Canvas/ui_bg/yindao_bg");
        this.GU.yindao_bg = cc.find("Canvas/ui_bg/yindao_bg");
        this.node_yindao_tishi = cc.find("yindao/tishi",this.GU.yindao_bg);

        this.node_pause_tishi.active = false;
        this.node_pause_hand.active = false;

        this.node_main_fuhuo = cc.find("lingqu",this.GU.main_bg);
        this.updateUIControl();
    },

    updateUIControl: function()
    {
        this.node_main_fuhuo.active = false;
        this.GU.main_bg.gunicon.active = false;
        this.GU.main_bg.more.active = false;

        this.GAME.more = null;
        this.GAME.more2 = null;

        var sto_channel = cc.sys.localStorage.getItem("channel");

        if(this.NetConfig.length>0)
        {
            for(var i=0;i<this.NetConfig.length;i++)
            {
                var con = this.NetConfig[i];
                if(con.id == "sharecard2")
                {
                    if(con.value == "1")
                    {
                        this.node_main_fuhuo.active = true;
                    }
                }
                else if(con.id == "moreicon")
                {
                    this.GU.main_bg.gunicon.moreicon = con.value;
                }
                else if(con.id == "morepic")
                {
                    this.GU.main_bg.gunicon.morepic = con.value;
                }
                else
                {
                    if(con.id.indexOf("channel") >= 0)
                    {
                        if(con.id == "channel_default" && this.GAME.more == null)
                            this.GAME.more = con.value;
                        else if(con.id == "channel_default_2" && this.GAME.more2 == null)
                            this.GAME.more2 = con.value;
                        if(sto_channel)
                        {
                            if(con.id == ("channel_"+sto_channel))
                                this.GAME.more = con.value;
                            else if(con.id == ("channel_"+sto_channel+"_2"))
                                this.GAME.more2 = con.value;
                        }
                    }
                }
            }
        }

         if(this.GAME.more)
        {
            var pic = this.GAME.more.split("--")[0];
            // this.GU.main_bg.more.active = true;
            this.loadPic(this.GU.main_bg.more,pic);

            // this.GU.over_bg.more.active = true;
            this.loadPic(this.GU.over_bg.more,pic);
        }
        if(this.GAME.more2)
        {
            var pic = this.GAME.more2.split("--")[0];
            // this.GU.main_bg.gunicon.active = true;
            this.loadPic(this.GU.main_bg.gunicon,pic);

            // this.GU.over_bg.gunicon.active = true;
            this.loadPic(this.GU.over_bg.gunicon,pic);
        }

        // if(this.GU.main_bg.gunicon.moreicon)
        // {
        //     this.loadPic(this.GU.main_bg.gunicon,this.GU.main_bg.gunicon.moreicon);
        //     this.GU.main_bg.gunicon.active = true;

        //     this.loadPic(this.GU.over_bg.gunicon,this.GU.main_bg.gunicon.moreicon);
        //     this.GU.over_bg.gunicon.active = true;
        // }
    },

    loadPic: function(sp,url)
    {
        cc.loader.load({url: url, type: 'png'}, function (err, tex) {
            if(err)
            {
                cc.log(err);
            }
            else
            {
                var spriteFrame = new cc.SpriteFrame(tex);
                sp.getComponent("cc.Sprite").spriteFrame = spriteFrame;
                sp.active = true;
                // sp.x = cc.winSize.width-spriteFrame.getRect().width/2;
            }
        });
    },

    updateLocalData: function(data)
    {
        if(data)
        {
            var datas = JSON.parse(data);
            if(datas.score)
            {
                cc.sys.localStorage.setItem("highscore",parseInt(datas.score));
                this.GU.main_bg.score.getComponent("cc.Label").string = parseInt(datas.score)+"";
            }
        }
        else
        {
            this.uploadData();
        }
    },

    uploadData: function()
    {
        var currscore = cc.sys.localStorage.getItem("highscore");
        currscore = currscore ? Number(currscore) : 0;
        var datas = {};
        datas.score = currscore;

        var data = JSON.stringify(datas);
        qianqista.uploaddatas(data,function(res){
            console.log("--uploaddatas:",res);
        });
    },

    resetData: function()
    {
        this.GAME.Config = JSON.parse(JSON.stringify(this.GAME.Configs));

        this.GAME.playerHp = 1;
        this.GAME.playerfuhuo = true;
        this.GAME.playerfuhuovideo = true;

        this.GAME.jumpTimes = 0;

        this.GAME.Time = 0;
        this.GAME.obsTime = 0;
        this.GAME.operateAble = true;

        this.GAME.bird = null;

        this.GAME.lastLevel =this.GAME.Config.LevelInfo[0];

        this.GAME.rotate = this.GAME.Config.Rotate[0];
        this.GAME.rotateMax = this.GAME.Config.Rotate[1];
        this.GAME.rotateAdd = (this.GAME.rotateMax-this.GAME.rotate)/this.GAME.Config.Rotate[2];

        this.GAME.size = this.GAME.Config.Size[0];
        this.GAME.sizeMax = this.GAME.Config.Size[1];
        this.GAME.sizeAdd = (this.GAME.sizeMax-this.GAME.size)/this.GAME.Config.Size[2];

        this.GAME.midScore = 0;

        this.GAME.score = 0;
        this.GAME.starLevel = 0;
        this.GAME.starScore = [500,2000,4500,8000,16000];

        this.GAME.difficulty = 1;
        this.GAME.sBase = 1;

    },

    resetUI: function()
    {
        this.GU.game_bg.active = true;
        this.GU.selfScore.getComponent("cc.Label").string = "0";

        var self = this;

        var playnum = cc.sys.localStorage.getItem("playnum");
        playnum = playnum ? playnum : 0;
        if(playnum == 0)
        {
            this.GU.yindao_bg.active = true;
            self.GAME.state = "STOP";
            this.GU.yindao_bg.timeout = false;
            var seq = cc.sequence(
                cc.delayTime(1),
                cc.callFunc(function(){
                    self.node_yindao_tishi.getComponent("cc.Label").string = "点击继续(2)";
                }),
                cc.delayTime(1),
                cc.callFunc(function(){
                    self.node_yindao_tishi.getComponent("cc.Label").string = "点击继续(1)";
                }),
                cc.delayTime(1),
                cc.callFunc(function(){
                    self.node_yindao_tishi.getComponent("cc.Label").string = "点击继续";
                    self.node_yindao_tishi.color = cc.color(255,255,255);
                    self.GU.yindao_bg.timeout = true;
                })
            );
            self.GU.yindao_bg.runAction(seq);
        }

        if(cc.sys.os == cc.sys.OS_ANDROID)
        {
            if(playnum == 1)
            {
                self.node_pause_tishi.active = true;
                self.node_pause_hand.active = true;
                self.GU.pause_bg.active = true;
                self.node_pause_hand.runAction(cc.repeatForever(cc.sequence(
                    cc.moveBy(0.3,10,0).easing(cc.easeSineIn()),
                    cc.moveBy(0.3,-10,0).easing(cc.easeSineIn())
                )));
                self.GAME.state = "STOP";
            }
        }
        playnum ++;
        cc.sys.localStorage.setItem("playnum",playnum);
    },

    resetBall: function()
    {
        var self = this;
        var ballNode = self.GAME.ballNode;
        ballNode.x = cc.winSize.width/2;
        ballNode.y = 437;
        ballNode.scale = self.GAME.size;

        self.GAME.player.x = cc.winSize.width/2;
        self.GAME.player.y = 437+373*self.GAME.size-5;
        self.GAME.player.rotation = 0;
        var st = self.GAME.player.getComponent(sp.Skeleton);
        st.setAnimation(0,"pao",true);
    },

    goMain: function()
    {
        this.node.stopAllActions();
        this.GAME.player.stopAllActions();
        this.GAME.ballNode.stopAllActions();

        this.resetData();
        this.GU.pause_bg.active = false;
        this.GU.game_bg.active = false;
        this.GU.over_bg.active = false;
        this.GAME.state = "MAIN";
        this.GU.main_bg.active = true;
        this.wxQuanActive(true);

        var currscore = cc.sys.localStorage.getItem("highscore");
        currscore = currscore ? currscore : 0;
        this.GU.main_bg.score.getComponent("cc.Label").string = currscore+"";

        this.wxCloseOver();
        this.wxCloseRank();

        this.GAME.tempObsContainer.removeAllChildren();
        this.GAME.ballNode.ball.removeAllChildren();

        this.resetBall();

        this.wxBannerHide();
    },

    wxCloseOver: function()
    {
        //this.GU.over_bg.active = false;
        //this.display_gray.active = false;
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //wx.postMessage({ message: "closeOver" });
    },

    wxCloseRank: function()
    {
        //this.GU.paihang_bg.active = false;
        //this.display_gray_rank.active = false;
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //wx.postMessage({ message: "closeRank" });
    },

    wxCloseFuhuo: function()
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //    wx.postMessage({ message: "closeFuhuo" });
    },

    wxRank: function()
    {
        //this.GU.paihang_bg.active = true;
        //this.display_gray_rank.active = true;
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //wx.postMessage({ message: "friendRank" });
    },

    wxOverRank: function(score)
    {
        //this.GU.over_bg.active = true;
        //this.display_gray.active = true;
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //wx.postMessage({ message: "overRank",score:score });
    },

    wxUploadScore: function(score)
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //wx.postMessage({ message: "updateScore",score:score });
    },

    wxFuhuoRank: function(score)
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //    wx.postMessage({ message: "fuhuoRank",score:score});
    },

    wxGropShare: function()
    {
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            wx.shareAppMessage({
                query:"channel=groupsharemenu",
                title: "自从玩了这个游戏，世界杯都不看了",
                imageUrl: cc.url.raw("resources/zhuanfa.jpg"),
                success: function(res)
                {
                    qianqista.share(true);
                    cc.log(res);
                },
                fail: function()
                {
                    qianqista.share(false);
                }
            });
            qianqista.event("btn_grouppaiming");
        }
        
    },
    wxGropShareChange: function()
    {
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            var s = "我滚了"+ this.GAME.score + "分，我变残了，也变强了，你能超过我么？";
            wx.shareAppMessage({
                query:"channel=sharechangemenu",
                title: s,
                imageUrl: cc.url.raw("resources/zhuanfa.jpg"),
                success: function(res)
                {
                    qianqista.share(true);
                    cc.log(res);
                },
                fail: function()
                {
                    qianqista.share(false);
                }
            });
            qianqista.event("btn_share_tiaozhan");
        }
        
    },
    wxGropShareCard: function()
    {
        var sharetime = cc.sys.localStorage.getItem("sharetime");
        sharetime = sharetime ? sharetime : 0;
        var now = new Date().getTime();
        if(now - sharetime > 24*60*60*1000)
        {
            cc.sys.localStorage.setItem("sharetime",now);
            cc.sys.localStorage.setItem("sharenum",0);
        }

        var sharenum = cc.sys.localStorage.getItem("sharenum");
        sharenum = sharenum ? sharenum : 0;
        if(sharenum>=5)
        {
            wx.showToast({
                title: "每天最多领取5次"
            });
            return;
        }

        qianqista.event("btn_share_card");

        var self = this;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            wx.shareAppMessage({
                title: "自从玩了这个游戏，世界杯都不看了",
                imageUrl: cc.url.raw("resources/zhuanfa.jpg"),
                success: function(res)
                {
                    if(res.shareTickets && res.shareTickets.length>0)
                    {
                         wx.showToast({
                            title: "获取到一个复活卡"
                        });
                        cc.sys.localStorage.setItem("sharenum",(sharenum+1));

                        var cardnum = cc.sys.localStorage.getItem("cardnum");
                        cardnum = cardnum ? cardnum : 0;
                        cardnum = parseInt(cardnum) + 1;
                        cc.sys.localStorage.setItem("cardnum",cardnum);
                        self.node_card_num.getComponent("cc.Label").string = cardnum+"";

                        self.node_fuhuocard_num.getComponent("cc.Label").string = cardnum + "";
                        if(cardnum<1)
                        {
                            self.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = false;
                        }
                        else
                        {
                            self.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = true;
                        }
                    }
                    else
                    {
                        wx.showToast({
                            title: "请分享到群"
                        });
                    }
                    qianqista.share(true);
                    cc.log(res);
                }
                ,
                fail: function()
                {
                    qianqista.share(false);
                }
        });
        }
        else
        {
            var cardnum = cc.sys.localStorage.getItem("cardnum");
            cardnum = cardnum ? cardnum : 0;
            cardnum = parseInt(cardnum) + 1;
            cc.sys.localStorage.setItem("cardnum",cardnum);
            self.node_card_num.getComponent("cc.Label").string = cardnum+"";

            self.node_fuhuocard_num.getComponent("cc.Label").string = cardnum + "";
            if(cardnum<1)
            {
                self.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = false;
            }
            else
            {
                self.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = true;
            }
        }
    },

    wxGropShareFuhuo: function()
    {
        var self = this;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            wx.shareAppMessage({
                query:"channel=sharefuhuomenu",
                title: this.userInfo.nickName +"挑战失败，快来帮帮 Ta",
                imageUrl: cc.url.raw("resources/zhuanfa.jpg"),
                success: function(res)
                {
                    if(res.shareTickets && res.shareTickets.length>0)
                    {
                        wx.showToast({
                            title: "复活成功"
                        });
                        self.fuhuo(false);
                    }
                    else
                    {
                        wx.showToast({
                            title: "请分享到群"
                        });
                    }
                    qianqista.share(true);
                },
                fail: function()
                {
                    qianqista.share(false);
                }
            });
            qianqista.event("btn_share_fuhuo");
        }
        else
        {
            self.fuhuo(false);
        }
    },

    wxVideoLoad: function()
    {
        var self = this;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            this.rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId:'adunit-8f2050166fc0da40'});
            this.rewardedVideoAd.onLoad(function(){
                console.log('激励视频 广告加载成功')
            });
            this.rewardedVideoAd.onClose(function(res){
                // 用户点击了【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是一个 undefined
                if (res && res.isEnded || res === undefined) {
                    if(self.GAME.VIDEOAD_TYPE == 1)
                    {
                        self.fuhuo2();
                        wx.showToast({
                            title: "复活成功"
                        });
                    }
                
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    if(self.GAME.VIDEOAD_TYPE == 1)
                    {
                        wx.showToast({
                            title: "复活失败"
                        });
                    }
                }
                self.resumeMusic();
            });


            var openDataContext = wx.getOpenDataContext();
            var sharedCanvas = openDataContext.canvas;
            var sc = sharedCanvas.width/this.dsize.width;
            var dpi = cc.view._devicePixelRatio;
            this.bannerAd = wx.createBannerAd({
                adUnitId: 'adunit-fe2f6a1b565cad33',
                style: {
                    left: 0,
                    top: sharedCanvas.height/dpi-320/3.5,
                    width: 320,
                }
            });
            var bannerAd = this.bannerAd;
            this.bannerAd.onResize(function(res){
                // console.log(res.width, res.height)
                // console.log(bannerAd.style.realWidth, bannerAd.style.realHeight)
                bannerAd.style.left = (sharedCanvas.width/dpi-res.width)/2;
                bannerAd.style.top = sharedCanvas.height/dpi-res.height;
            });

        }
    },
    wxVideoShow: function(type)
    {
        var self = this;
        this.GAME.VIDEOAD_TYPE = type;
        if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        {
            if(type == 1)
            {
                this.rewardedVideoAd.show().catch(function(err){
                    self.rewardedVideoAd.load().then(function(){
                        self.rewardedVideoAd.show();
                    });
                });
            }
        }
        else
        {
            if(type == 1)
            {
                this.fuhuo2();
            }
        }
    },

    wxBannerShow: function()
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //    this.bannerAd.show();
    },

    wxBannerHide: function()
    {
        //if(cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS)
        //    this.bannerAd.hide();
    },

    wxMore: function()
    {
        var appIdstr = 'wx604f780b017da7df';
        var pathstr = 'pages/main/main';
        if(this.GAME.more)
        {
            var ss = this.GAME.more.split("--");
            appIdstr = ss[1];
            pathstr = ss[2];
        }

        wx.navigateToMiniProgram({
              appId: appIdstr,
              path: pathstr,
              extraData: {
                foo: 'bar'
              },
              // envVersion: 'develop',
              success:function(res){
                // 打开成功
              }
            });
        // wx.previewImage({
        //     urls: ["https://www.77qqup.com:442/images/apptuijian/hulubox.jpg"],
        //     success: function (res) {
        //     },
        //     fail: function (res) {
        //         return;
        //     }
        // });
    },

    wxGun: function()
    {
        var appIdstr = 'wx604f780b017da7df';
        var pathstr = 'pages/main/main';
        if(this.GAME.more2)
        {
            var ss = this.GAME.more2.split("--");
            appIdstr = ss[1];
            pathstr = ss[2];
        }

        wx.navigateToMiniProgram({
          appId: appIdstr,
          path: pathstr,
          extraData: {
            foo: 'bar'
          },
          // envVersion: 'develop',
            success:function(res){
            // 打开成功
          }
        });
    },

    click: function (event,data) {
        if(data == "start")
        {
            this.wxQuanActive(false);
            this.GU.main_bg.active = false;
            this.GAME.state = "START";
            this.resetData();
            this.resetUI();
            this.resetBall();

            this.wxBannerShow();
        }
        else if(data == "pause")
        {
            this.GU.pause_bg.active = true;
            cc.director.pause();
        }
        else if(data == "yindao")
        {
            if(this.GU.yindao_bg.timeout)
            {
                this.GAME.state = "START";
                this.GU.yindao_bg.active = false;
            }
        }
        else if(data == "resume")
        {
            if(this.node_pause_tishi.active)
            {
                this.GAME.state = "START";
                this.node_pause_tishi.active = false;
                this.node_pause_hand.active = false;
                this.GU.pause_bg.active = false;
            }
            else
            {
                cc.director.resume();
                this.GU.pause_bg.active = false;
            }
        }
        else if(data == "main")
        {
            cc.director.resume();
            this.goMain();
        }
        else if(data == "again")
        {
            this.wxCloseOver();
            this.resetStart();

            this.wxBannerShow();
        }
        else if(data == "change")
        {
            this.wxGropShareChange();
        }
        else if(data == "fuhuo_usecard")
        {
            this.GU.fuhuocard_bg.active = false;
            this.fuhuo(true);
        }
        else if(data == "qiuzu")
        {
            this.wxGropShareCard();
        }
        else if(data == "fuhuo_vedio")
        {
            this.wxVideoShow(1);
        }
        else if(data == "fuhuoka_open")
        {
            this.GU.fuhuocard_bg.active = true;
            var cardnum = cc.sys.localStorage.getItem("cardnum");
            cardnum = cardnum ? cardnum : 0;
            this.node_fuhuocard_num.getComponent("cc.Label").string = cardnum + "";
            if(cardnum<1)
            {
                this.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = false;
            }
            else
            {
                this.node_fuhuocard_fuhuo_usecard.getComponent("cc.Button").interactable = true;
            }
        }
        else if(data == "closefuhuocard")
        {
            this.GU.fuhuocard_bg.active = false;
        }
        else if(data == "skip")
        {
            this.skip();
        }
        else if(data == "paiming")
        {
            this.wxQuanActive(false);
            this.showPaiming();
        }
        else if(data == "paimingover")
        {
            this.showPaiming();
            this.wxCloseOver();
            this.GU.over_bg.active = false;
            this.openover = true;
        }
        else if(data == "close")
        {
            this.wxCloseRank();
            if(this.openover)
            {
                this.openover = false;
                this.GU.over_bg.active = true;
                this.wxOverRank();
            }
            else
            {
                this.wxQuanActive(true);
            }
        }
        else if(data == "lingqu")
        {
            this.GU.card_bg.active = true;
            this.wxQuanActive(false);
            var cardnum = cc.sys.localStorage.getItem("cardnum");
            cardnum = cardnum ? cardnum : 0;
            this.node_card_num.getComponent("cc.Label").string = cardnum+"";
            qianqista.event("btn_main_lingqu");
        }
        else if(data == "closecard")
        {
            this.wxQuanActive(true);
            this.GU.card_bg.active = false;
        }
        else if(data == "share")
        {
            this.wxGropShare();
        }
        else if(data == "sharecard")
        {
            this.wxGropShareCard();
        }
        else if(data == "more")
        {
            this.wxMore();
        }
        else if(data == "gunicon")
        {
            this.wxGun();
        }

        cc.log(data);
    },

    showPaiming: function()
    {
        this.wxRank();
    },

    doOther: function(dt)
    {
        var x = Math.cos(15*Math.PI/180);
        var y = Math.sin(15*Math.PI/180);
        var vec = cc.v2(x,y).mulSelf(this.GAME.rotate*dt*4.5);
        var p1 = this.GAME.po1.position.add(vec);
        this.GAME.po1.position = p1;

        var p2 = this.GAME.po2.position.add(vec);
        this.GAME.po2.position = p2;

        if(p1.x>cc.winSize.width+30)
        {
            var np = p2.add(this.GAME.rVec);
            this.GAME.po1.position = np;
        }

        if(p2.x>cc.winSize.width+30)
        {
            var np = p1.add(this.GAME.rVec);
            this.GAME.po2.position = np;
        }

        var trees = this.GAME.treeContainer.children;
        if(trees.length == 0)
        {
            if(Math.floor(Math.random()*100+1)>50)
            {
                var t = Math.floor(Math.random()*3+1);

                var shu = null;
                if(t == 1)
                    shu = cc.instantiate(this.shu1);
                else if(t == 2)
                    shu = cc.instantiate(this.shu2);
                else if(t == 3)
                    shu = cc.instantiate(this.shu3);
                shu.x=-50;
                shu.y=Math.floor(Math.random()*250+200);
                this.GAME.treeContainer.addChild(shu);

            }
        }
        else
        {
            for(var i=0;i<trees.length;i++)
            {
                var shu = trees[i];
                var p = cc.v2(shu.position);
                shu.position = p.add(vec);
                if(p.x>(cc.winSize.width+100))
                {
                    shu.destroy();
                }
            }
        }

        var r = this.GAME.ballNode.ball.rotation-this.GAME.rotate*dt;
        r = r%360;

        this.GAME.ballNode.ball.rotation = r;
        this.GAME.ballNode.ball2.rotation = r;

        var yuns = this.GAME.yunContainer.children;
        for(var i=0;i<yuns.length;i++)
        {
            var yun = yuns[i];
            var deff = dt*yun.speed;
            yun.x = (yun.x+deff);
            var bx = yun.getBoundingBox();
            if(bx.x>cc.winSize.width+50)
            {
                yun.x = -(bx.width+50);
                yun.y = (Math.floor(Math.random()*(cc.winSize.height*0.9)+cc.winSize.height*0.6));
            }
        }

        var sans = this.GAME.sans;
        for(var i=0;i<sans.length;i++)
        {
            var san = sans[i];
            var san1 = san[0];
            var san2 = san[1];

            var s = san[2];

            var x1 = san1.x+dt*s;
            san1.x = x1;

            var x2 = san2.x+dt*s;
            san2.x = x2;

            if(x1>cc.winSize.width)
            {
                var width = san2.getContentSize().width;
                san1.x = (x2-width);
            }

            if(x2>cc.winSize.width)
            {
                var width = san1.getContentSize().width;
                san2.x = (x1-width);
            }
        }

        var temps = this.GAME.tempObsContainer.children;
        for(var i=0;i<temps.length;i++)
        {
            var obs = temps[i];
            var p = obs.position.add(vec);
            obs.position = p;
            if(p.x>=cc.winSize.width/2)
            {
                this.createBallObs(obs.type);
                obs.destroy();
            }
        }

        if(this.GAME.operateAble)
        {
            this.GAME.rotate = this.GAME.rotate + this.GAME.rotateAdd*dt;
            if(this.GAME.rotate>=this.GAME.rotateMax)
            {
                this.GAME.rotate = this.GAME.rotateMax;
            }
            var ori = 437+373*this.GAME.size-5;
            this.GAME.size = this.GAME.size + this.GAME.sizeAdd*dt;
            if(this.GAME.size>=this.GAME.sizeMax)
            {
                this.GAME.size = this.GAME.sizeMax;
            }
            this.GAME.ballNode.setScale(this.GAME.size);

            var now = 437+373*this.GAME.size-5;
            var deff = now-ori;
            this.GAME.player.y = (this.GAME.player.y+deff);

            var temp = dt*10;
            this.GAME.midScore += dt;
            if(this.GAME.midScore>=1)
            {
                this.playerBingGo(1);
                this.GAME.midScore = 0;
            }
            //this.GAME.midScore = this.GAME.midScore + this.GAME.rotate*dt/80;
            //this.playerBingGo(temp);
        }

    },

    createBallObs: function(t)
    {
        var obs = null;
        if(t == 1)
            obs = cc.instantiate(this.obs1);
        else if(t == 2)
            obs = cc.instantiate(this.obs2);
        else if(t == 3)
            obs = cc.instantiate(this.obs3);
        obs.rotation = 180-this.GAME.ballNode.ball.rotation%360;
        obs.scale = 1/this.GAME.ballNode.scale;
        obs.zIndex = -1;


        obs.type = t;
        obs.life = 1;
        if(obs.type==3)
        {
            obs.life = 3;

        }
        obs.sign = 1;

        //var m = this.GAME.ballNode.ball.width*this.GAME.ballNode.ball.scale;
        var h = this.dsize.height - cc.winSize.height;
        var p = this.GAME.ballNode.ball.convertToNodeSpaceAR(cc.v2(cc.winSize.width/2+1,437-h/2));
        obs.x = p.x;
        obs.y = p.y;

        this.GAME.ballNode.ball.addChild(obs);
        cc.audioEngine.play(this.audio_get, false, 1);
    },

    playerBingGo: function(score)
    {
        this.GAME.score = this.GAME.score + score*this.GAME.sBase;
        this.GU.selfScore.getComponent("cc.Label").string = Math.floor(this.GAME.score)+"";
    },

    checkCollision: function()
    {
        var pOBB = this.getOBB(this.GAME.player,true);

        if(this.GAME.bird)
        {
            var bOBB = this.getOBB(this.GAME.bird);
            if(pOBB.isCollidWithOBB(bOBB) && this.GAME.operateAble)
            {
                this.playerDead(true);
            }
            else
            {
                if(this.GAME.bird.score == 1)
                {
                    var p1 = this.GAME.bird.convertToWorldSpaceAR(this.GAME.bird.position);
                    var p2 = this.GAME.player.convertToWorldSpaceAR(this.GAME.player.position);
                    if(p1.x-50>p2.x)
                    {
                        this.GAME.bird.score = 0;
                        this.playerBingGo(2);
                    }
                }

            }
        }

        var obss = this.GAME.ballNode.ball.children;
        for(var i=0;i<obss.length;i++)
        {
            var obs = obss[i];
            var p = this.GAME.ballNode.ball.convertToWorldSpaceAR(obs.position);

            var oriSign = obs.sign;
            var nowSign = p.x>=cc.winSize.width/2 ? 1 : -1;
            if(nowSign==1 && oriSign*nowSign<0)
            {
                obs.life = obs.life - 1;
                if(obs.type==3)
                {
                    var cp = this.GAME.ballNode.ball.convertToNodeSpaceAR(cc.v2(p.x,p.y+30));
                    obs.position = cp;
                }
            }

            if(this.GAME.operateAble && nowSign==-1 && oriSign*nowSign<0)
            {
                this.playerBingGo(2);
            }
            obs.sign = nowSign;
            if(obs.life<=0 && this.GAME.operateAble)
            {
                obs.destroy();
                this.throwObs(obs.type);
            }
            else
            {
                var oOBB = this.getOBB(obs);
                if(pOBB.isCollidWithOBB(oOBB) && this.GAME.operateAble)
                {
                    this.playerDead();
                }
            }
        }
    },

    throwObs: function(t)
    {
        var obs = null;
        if(t == 1)
            obs = cc.instantiate(this.obs1);
        else if(t == 2)
            obs = cc.instantiate(this.obs2);
        else if(t == 3)
            obs = cc.instantiate(this.obs3);
        obs.x = cc.winSize.width/2;
        obs.y = 465;
        obs.rotation = Math.floor(Math.random()*360+1);
        obs.zIndex = 100;
        this.GAME.bg.addChild(obs);
        obs.runAction(cc.sequence(
            cc.spawn(
            cc.moveBy(1,cc.v2(5,1.3).mulSelf(100)),
            cc.rotateBy(1,360)
            ),
            cc.removeSelf()
        ));
        cc.audioEngine.play(this.audio_throw, false, 1);
    },

    playerDead: function(isBird)
    {
        this.playerHurt(1);
        this.GAME.operateAble = false;
        this.GAME.player.stopAllActions();

        var st = this.GAME.player.getComponent(sp.Skeleton);
        st.setAnimation(0,"tiao2",false);

        var temps = this.GAME.tempObsContainer.children;
        for(var i=0;i<temps.length;i++)
        {
            temps[i].destroy();
        }

        var obss = this.GAME.ballNode.ball.children;
        for(var i=0;i<obss.length;i++)
        {
            var obs = obss[i];
            this.throwObs(obs.type);
            obs.destroy();
        }

        if(isBird)
        {
            this.GAME.player.runAction(cc.moveBy(1,cc.v2(5,1).mulSelf(150)));
        }
        else
        {
            this.GAME.player.runAction(cc.moveBy(1,cc.v2(-5,1).mulSelf(150)));
        }

        var self = this;
        var act = cc.sequence(
            cc.delayTime(0.5),
            cc.callFunc(function()
            {
                self.playerScorll();
                //if(self.GAME.playerfuhuo || self.GAME.playerfuhuovideo)
                //{
                //    self.judgeFuhuo();
                //}
                //else
                //{
                    var seq2 = cc.sequence(
                        cc.delayTime(2),
                        cc.callFunc(function(){
                            self.gameOver();
                        })
                    );
                    self.node.runAction(seq2);
                //}
            })
        );
        this.node.runAction(act);

        cc.audioEngine.play(this.audio_dead, false, 1);


    },

    playerScorll: function()
    {
        var x = Math.cos(195*Math.PI/180)*700;
        var y = Math.sin(195*Math.PI/180)*700;
        this.GAME.ballNode.runAction(cc.moveBy(0.8,cc.v2(x,y)));
    },

    judgeFuhuo: function()
    {
        var self = this;
        if(this.NetConfig.length>0)
        {
            for(var i=0;i<this.NetConfig.length;i++)
            {
                var con = this.NetConfig[i];
                if(con.id == "sharecard")
                {
                    if(con.value == "0")
                    {
                        var seq2 = cc.sequence(
                            cc.delayTime(2),
                            cc.callFunc(function(){
                                self.gameOver();
                            })
                        );
                        self.node.runAction(seq2);
                        return;
                    }
                }
            }
        }


        var cardnum = cc.sys.localStorage.getItem("cardnum");
        cardnum = cardnum ? cardnum : 0;
        this.GU.fuhuo_bg.score.getComponent("cc.Label").string = Math.floor(this.GAME.score)+"";
        this.GAME.state = "FUHUO";
        this.GU.fuhuo_bg.active = true;
        this.GU.game_bg.active = false;
        this.GU.node_fuhuo_fu_card.getComponent("cc.Button").interactable = this.GAME.playerfuhuo;
        this.GU.node_fuhuo_fu_video.getComponent("cc.Button").interactable = this.GAME.playerfuhuovideo;

        this.wxFuhuoRank(Math.floor(this.GAME.score));
    },

    fuhuo: function(isCard)
    {
        var self = this;
        if(isCard)
        {
            var cardnum = cc.sys.localStorage.getItem("cardnum");
            cc.sys.localStorage.setItem("cardnum",(cardnum-1));
            
        }
        self.GU.game_bg.active = true;
        self.GU.fuhuo_bg.active = false;
        self.GAME.playerHp = 1;
        self.GAME.playerfuhuo = false;

        this.resetBallNode();
        this.GAME.state = "START";

        this.wxCloseFuhuo();
    },

    fuhuo2: function()
    {
        var self = this;


        self.GU.game_bg.active = true;
        self.GU.fuhuo_bg.active = false;
        self.GAME.playerHp = 1;
        self.GAME.playerfuhuovideo = false;

        this.resetBallNode();
        this.GAME.state = "START";

        this.wxCloseFuhuo();
    },

    skip: function()
    {
        var self = this;

        self.GU.fuhuo_bg.active = false;
        self.gameOver();
        this.wxCloseFuhuo();
    },

    gameOver: function()
    {
        this.GU.over_bg.score.getComponent("cc.Label").string = Math.floor(this.GAME.score)+"";

        this.GAME.state = "OVER";
        this.GU.over_bg.active = true;
        this.GU.game_bg.active = false;

        var currscore = cc.sys.localStorage.getItem("highscore");
        if(Math.floor(this.GAME.score) > currscore)
            cc.sys.localStorage.setItem("highscore",Math.floor(this.GAME.score));

        this.wxOverRank(Math.floor(this.GAME.score));
        this.uploadData();

        this.wxBannerHide();
    },

    getChaoyue: function()
    {
        if(this.GAME.score <= 5)
        {
            return "9%";
        }
        else if(this.GAME.score <= 10 && this.GAME.score > 5)
        {
            return "11%";
        }
        else if(this.GAME.score <= 12 && this.GAME.score > 10)
        {
            return "12%";
        }
        else if(this.GAME.score <= 15 && this.GAME.score >12)
        {
            return "18%";
        }
        else if(this.GAME.score <= 18 && this.GAME.score > 15)
        {
            return "32%";
        }
        else if(this.GAME.score <= 23 && this.GAME.score >20)
        {
            return "66%";
        }
        else if(this.GAME.score <= 25 && this.GAME.score > 23)
        {
            return "72%";
        }
        else if(this.GAME.score <= 28 && this.GAME.score > 25)
        {
            return "81%";
        }
        else if(this.GAME.score <= 30 && this.GAME.score >28)
        {
            return "86%";
        }
        else if(this.GAME.score <= 40 && this.GAME.score > 30)
        {
            return "90%";
        }
        else if(this.GAME.score <= 50 && this.GAME.score > 40)
        {
            return "95%";
        }
        else if(this.GAME.score > 50)
        {
            return "99%";
        }
    },

    resetStart: function()
    {
        //this.GAME.state = "START";
        this.resetData();
        this.resetUI();
        this.GAME.ballNode.scale = this.GAME.size;
        this.resetBallNode();
    },

    resetBallNode: function()
    {
        cc.log("resetBallNode");
        this.GU.game_bg.active = true;
        this.GU.over_bg.active = false;

        var self = this;
        var x = Math.cos(15*Math.PI/180)*700;
        var y = Math.sin(15*Math.PI/180)*700;
        var ballNode = self.GAME.ballNode;
        ballNode.x = cc.winSize.width/2+x;
        ballNode.y = 437+y;

        ballNode.runAction(cc.sequence(
            cc.moveTo(1,cc.v2(cc.winSize.width/2,437)),
            cc.callFunc(function()
            {
                self.GAME.rotate = self.GAME.Config.Rotate[0];
                //self.GAME.size = self.GAME.Config.Size[0];

                self.GAME.jumpTimes = 0;
                self.GAME.operateAble = true;

                self.GAME.player.x = cc.winSize.width/2;
                self.GAME.player.y = cc.winSize.height*0.7;
                self.GAME.player.opacity = 0;

                self.GAME.player.stopAllActions();
                self.GAME.player.runAction(cc.moveTo(0.1,cc.v2(cc.winSize.width/2,437+373*self.GAME.size-5)));
                self.GAME.player.runAction(cc.sequence(
                    cc.fadeIn(0.1),
                    cc.callFunc(function(){
                        self.GAME.state = "START";
                    })
                ));

                self.GAME.player.rotation = 0;
                var st = self.GAME.player.getComponent(sp.Skeleton);
                st.setAnimation(0,"pao",true);
            })
        ));
    },

    playerHurt: function(hp)
    {
        if(this.GAME.state != "OVER")
        {
            this.GAME.playerHp = this.GAME.playerHp - hp;
        }
    },

    getOBB: function(sp,isPlayer)
    {
        var obb = {};
        obb.vertex = [];
        if(isPlayer)
        {
            var width = 40;
            var height = 80;
            obb.vertex[0] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(-width/2,0+15)));
            obb.vertex[1] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(width/2,0+15)));
            obb.vertex[2] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(width/2,height+15)));
            obb.vertex[3] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(-width/2,height+15)));
        }
        else
        {
            if(sp.type==4)
            {
                var width = 80;
                var height = 40;
                obb.vertex[0] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(-width/2,0-15)));
                obb.vertex[1] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(width/2,0-15)));
                obb.vertex[2] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(width/2,height-15)));
                obb.vertex[3] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(-width/2,height-15)));
            }
            else
            {
                var bx = sp.getContentSize();
                obb.vertex[0] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(0,0)));
                obb.vertex[1] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(bx.width,0)));
                obb.vertex[2] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(bx.width,bx.height)));
                obb.vertex[3] = cc.v2(sp.convertToWorldSpaceAR(cc.v2(0,bx.height)));
            }
        }

        obb.getAxies = function()
        {
            var axies = [];
            var vertex = this.vertex;
            for(var i=0;i<4;i++)
            {
                var p = vertex[i].sub(vertex[(i+1)%4]);
                var np = p.normalizeSelf();
                axies[i] = cc.v2(-np.y,np.x);
            }
            return axies;
        };

        obb.getProjection = function(axie)
        {
            var vertex = this.vertex;
            var min = vertex[0].dot(axie);
            var max = min;
            for(var i=1;i<4;i++)
            {
                var temp = vertex[i].dot(axie);
                if(temp>max)
                {
                    max = temp;
                }
                else if(temp < min)
                {
                    min = temp;
                }
            }
            var projection = {};
            projection.min = min;
            projection.max = max;
            projection.overlap = function(other)
            {
                if(this.min > other.max)
                {
                    return false;
                }
                if(this.max < other.min)
                {
                    return false;
                }
                return true;
            };
            return projection;
        };

        obb.isCollidWithOBB = function(other)
        {
            var axies1 = this.getAxies();
            var axies2 = other.getAxies();
            for(var i=0;i<4;i++)
            {
                var proj1 = this.getProjection(axies1[i]);
                var proj2 = other.getProjection(axies1[i]);
                if(!proj1.overlap(proj2))
                {
                    return false;
                }
            }
            for(var i=0;i<4;i++)
            {
                var proj1 = this.getProjection(axies2[i]);
                var proj2 = other.getProjection(axies2[i]);
                if(!proj1.overlap(proj2))
                {
                    return false;
                }
            }
            return true;
        };

        return obb;
    },

    createBird: function()
    {
        if(!this.GAME.bird)
        {
            this.GAME.bird = cc.instantiate(this.bird);
            this.GAME.bird.position = cc.v2(-50,437+373*this.GAME.size-5+30);
            this.GAME.bg.addChild(this.GAME.bird);
            var self = this;

            this.GAME.bird.type = 4;
            this.GAME.bird.score = 1;
            this.GAME.bird.runAction(cc.sequence(
                cc.moveBy(2,cc.v2(cc.winSize.width+100,0)),
                cc.callFunc(function(){
                    self.GAME.bird.destroy();
                    self.GAME.bird = null;
                })
            ));
            cc.audioEngine.play(this.audio_bird, false, 1);
        }
    },
    getObsType: function(oRate)
    {
        var total = 0;
        for(var i=0;i<oRate.length;i++)
        {
            total = total + oRate[i];
        }
        if(total>0)
        {
            var now = 0;
            var rate = Math.floor(Math.random()*total+1);
            for(var i=0;i<oRate.length;i++)
            {
                now = now + oRate[i];
                if(rate<=now)
                {
                    return i+1;
                }
            }
        }
        return 1;
    },

    createObstacle: function(t)
    {
        var obs = null;
        if(t == 1)
            obs = cc.instantiate(this.obs1);
        else if(t == 2)
            obs = cc.instantiate(this.obs2);
        else if(t == 3)
            obs = cc.instantiate(this.obs3);
        obs.x = -50;
        obs.y = 325;
        obs.rotation = -15;
        this.GAME.tempObsContainer.addChild(obs);
        obs.type = t;

    },

    nextLevel: function()
    {
        this.GAME.Time = 0;
        this.GAME.obsTime = 0;
        this.GAME.Config.LevelInfo.splice(0,1);
        if(this.GAME.Config.LevelInfo.length>0)
        {
            this.GAME.lastLevel = this.GAME.Config.LevelInfo[0];
        }
        else
        {
            this.GAME.Config.LevelInfo[0] = this.GAME.lastLevel;
        }
    },

    playerJump: function()
    {
        if(this.GAME.state == "START")
        {
            var self = this;
            this.GAME.jumpTimes = this.GAME.jumpTimes + 1;
            if(this.GAME.jumpTimes == 1)
            {
                var st = this.GAME.player.getComponent(sp.Skeleton);
                st.setAnimation(0,"tiao1",false);
                var act = cc.sequence(
                    cc.jumpBy(0.65,cc.v2(0,0),90,1),
                    cc.callFunc(function()
                    {
                        st.setAnimation(0,"pao",true);
                        self.GAME.jumpTimes = 0;
                    })
                );
                this.GAME.player.runAction(act);
                cc.audioEngine.play(this.audio_jump, false, 1);
            }
            else if(this.GAME.jumpTimes == 2)
            {
                this.GAME.player.stopAllActions();
                var st = this.GAME.player.getComponent(sp.Skeleton);
                st.setAnimation(0,"tiao2",false);
                var diffY = 437+373*this.GAME.size-5 - this.GAME.player.y;
                var act = cc.sequence(
                    cc.jumpBy(0.65,cc.v2(0,diffY),210+diffY,1),
                    cc.callFunc(function()
                    {
                        st.setAnimation(0,"pao",true);
                        self.GAME.jumpTimes = 0;
                    })
                );
                this.GAME.player.runAction(act);
                cc.audioEngine.play(this.audio_jump, false, 1);
            }
        }
    },

    addListener: function()
    {
        var self = this;
        // touch input
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function(touch, event) {
                if(self.GAME.state=="START" && self.GAME.operateAble)
                {
                    self.playerJump();
                }
                return true;
            },
            onTouchEnded: function(touch, event) {

            }
        }, self.node);
    },

    // called every frame
    update: function (dt) {
        if(this.GAME.state == "START")
        {
            this.doOther(dt);
            this.checkCollision();
            if(this.GAME.operateAble)
            {
                this.GAME.Time = this.GAME.Time + dt;
                this.GAME.obsTime = this.GAME.obsTime + dt;
                var levelInfo = this.GAME.Config.LevelInfo[0];
                if(levelInfo.OBird.length>0)
                {
                    if(this.GAME.Time>=levelInfo.OBird[0])
                    {
                        this.createBird();
                        this.GAME.Config.LevelInfo[0].OBird.splice(0, 1);
                    }
                }

                if(this.GAME.obsTime>=levelInfo.OTime)
                {
                    this.GAME.obsTime = this.GAME.obsTime - levelInfo.OTime;
                    var t = this.getObsType(levelInfo.ORate);
                    this.createObstacle(t);
                }

                if(this.GAME.Time>=levelInfo.Time)
                {
                    this.nextLevel();
                }
            }

            this.uploadScoreDt += dt;
            if(this.uploadScoreDt > 5)
            {
                this.uploadScoreDt = 0;
                this.wxUploadScore(Math.floor(this.GAME.score));
            }
        }

        //this.subdt += dt;
        //var sdd = 0.02;
        //if(this.GAME.state == "START")
        //    sdd = 0.1;
        //if(this.subdt > sdd)
        //{
        //    this.subdt = 0;
        //    this._updaetSubDomainCanvas();
        //}

    }
});
