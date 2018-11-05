

cc.Class({
    extends: cc.Component,

    properties: {
        paimingItem: {
            default: null,
            type: cc.Prefab
        },
        chaoyueItem: {
            default: null,
            type: cc.Prefab
        }

    },


    onLoad: function()
    {
        this.dsize = cc.view.getDesignResolutionSize();
        this.initUI();
        this.adapt();

        this.kvdata = {
            wxgame:
            {
                score: 0,
                update_time: 0
            },
            card: 0
        };
        this.userInfo = null;
        this.friendRank = null;
        this.chaoyueData = [];
        var self = this;


        wx.onMessage(function(data){
            if(data.message == "closeOver")
            {
                self.node_over.active = false;
            }
            else if(data.message == "closeRank")
            {
                self.node_paiming.active = false;
            }
            else if(data.message == "closeFuhuo")
            {
                self.node_fuhuo.active = false;
            }
            else if(data.message == "friendRank"){ //好友排行榜
                self.showPaiming();
            }
            else if(data.message == "overRank"){ //3人排行榜
                self.uploadScore(data.score);
                self.showOverRank();
                self.chaoyueData = [];
            }
            else if(data.message == "fuhuoRank"){ //下个超越排行榜
                self.uploadScore(data.score);
                self.showFuhuoRank(data.score);
            }
            else if(data.message == "loginSuccess")
            {
                self.userInfo = data.userInfo;
                self.getUserRank();
                self.getFriendRank();
            }
            else if(data.message == "updateScore")
            {
                self.updateScore(data.score);
            }
            cc.log(data.message);
        });
    },



    adapt: function()
    {

        var nodes = [this.node_over];
        for(var i=0;i<nodes.length;i++)
        {
            cc.log(nodes[i]);
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

    initUI: function()
    {
        var self = this;
        self.node_over = cc.find("Canvas/ui_bg/over_bg");
        self.node_over_box1 = cc.find("paiming_box/bg/box1",self.node_over);
        self.node_over_box2 = cc.find("paiming_box/bg/box2",self.node_over);
        self.node_over_box3 = cc.find("paiming_box/bg/box3",self.node_over);

        self.node_paiming = cc.find("Canvas/ui_bg/paihang_bg");
        self.node_paiming_content = cc.find("bg/box1/scroll/view/content",self.node_paiming);
        self.node_paiming_num = cc.find("bg/box2/itemPaiming/num",self.node_paiming);
        self.node_paiming_icon = cc.find("bg/box2/itemPaiming/icon",self.node_paiming);
        self.node_paiming_nick = cc.find("bg/box2/itemPaiming/nick",self.node_paiming);
        self.node_paiming_score = cc.find("bg/box2/itemPaiming/score",self.node_paiming);

        self.node_fuhuo = cc.find("Canvas/ui_bg/fuhuo_bg");
        self.node_fuhuo_icon = cc.find("bg/bg/icon",self.node_fuhuo);
        self.node_fuhuo_nick = cc.find("bg/bg/nike",self.node_fuhuo);
        self.node_fuhuo_score = cc.find("bg/bg/score",self.node_fuhuo);
        self.node_fuhuo_no = cc.find("bg/bg/no",self.node_fuhuo);

        self.node_chaoyue = cc.find("Canvas/node_chaoyue");
    },


    click: function(event,data)
    {

    },

    showFuhuoRank: function(score)
    {
        this.node_fuhuo.active = true;

        var self = this;
        if(this.friendRank && this.userInfo)
        {
            self.showFuhuoRank2(score);
        }
        else
        {
            this.getFriendRank(function(){
                self.showFuhuoRank2(score);
            });
        }
    },

    showFuhuoRank2: function(score)
    {
        if(this.friendRank && this.userInfo)
        {
            var chaoyue = null;
            for(var i=this.friendRank.length-1;i>=0;i--)
            {
                var data = this.friendRank[i];
                if(data.nickname != this.userInfo.nickName &&
                    data.avatarUrl != this.userInfo.avatarUrl)
                {
                    var feiji_rank = data.KVDataList[0].value;
                    var rank  = JSON.parse(feiji_rank);
                    if(score < rank.wxgame.score)
                    {
                        chaoyue = data;
                        break;
                    }
                }
            }
            //if(chaoyue == null && this.friendRank.length>0)
            //    chaoyue = this.friendRank[0];
            if(chaoyue)
            {
                this.node_fuhuo_no.active = false;
                this.node_fuhuo_nick.active = true;
                this.node_fuhuo_score.active = true;
                this.node_fuhuo_icon.active = true;
                var feiji_rank = chaoyue.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                this.loadPic(this.node_fuhuo_icon,chaoyue.avatarUrl);
                this.node_fuhuo_nick.getComponent("cc.Label").string = chaoyue.nickname;
                this.node_fuhuo_score.getComponent("cc.Label").string = "得分:"+rank.wxgame.score;
            }
            else
            {
                this.node_fuhuo_no.active = true;
                this.node_fuhuo_nick.active = false;
                this.node_fuhuo_score.active = false;
                this.node_fuhuo_icon.active = false;
            }
        }
    },

    existChaoYue: function(data)
    {
        for(var i=0;i<this.chaoyueData.length;i++)
        {
            var data2 = this.chaoyueData[i];
            if(data.nickname == data2.nickname &&
                data.avatarUrl == data2.avatarUrl)
            {
                return true;
            }
        }
        return false;
    },

    updateScore: function(score)
    {
        if(this.friendRank && this.userInfo)
        {
            var chaoyue = null;
            for(var i=this.friendRank.length-1;i>=0;i--)
            {
                var data = this.friendRank[i];
                if(data.nickname != this.userInfo.nickName &&
                    data.avatarUrl != this.userInfo.avatarUrl && !this.existChaoYue(data))
                {
                    var feiji_rank = data.KVDataList[0].value;
                    var rank  = JSON.parse(feiji_rank);
                    if(score > rank.wxgame.score)
                    {
                        chaoyue = data;
                        break;
                    }
                }
            }
            if(chaoyue)
            {
                this.chaoyueData.push(chaoyue);

                var item = cc.instantiate(this.chaoyueItem);
                var icon = cc.find("icon",item);
                var nick = cc.find("nick",item);

                this.loadPic(icon,chaoyue.avatarUrl);
                nick.getComponent("cc.Label").string = "超越"+chaoyue.nickname;

                this.node_chaoyue.addChild(item);

                var seq = cc.sequence(
                    cc.fadeOut(0),
                    cc.moveTo(0,cc.v2(20,this.dsize.height*0.7)),
                    cc.spawn(
                        cc.fadeIn(0.5),
                        cc.moveTo(0.5,cc.v2(20,this.dsize.height*0.75)).easing(cc.easeSineIn())
                    ),
                    cc.delayTime(2),
                    cc.spawn(
                        cc.fadeOut(0.5),
                        cc.moveTo(0.5,cc.v2(20,this.dsize.height*0.8)).easing(cc.easeSineOut())
                    ),
                    cc.removeSelf()
                );

                item.runAction(seq);

                this.uploadScore(score);
            }
        }
    },

    showOverRank: function()
    {
        var self = this;
        this.getFriendRank(function(){
            self.showOverRank2();
        });
    },

    showOverRank2: function()
    {
        this.node_over.active = true;
        this.node_over_box1.active = false;
        this.node_over_box2.active = false;
        this.node_over_box3.active = false;

        if(this.friendRank && this.userInfo)
        {
            //找到最近3个
            var list = [];
            for(var i=0;i<this.friendRank.length;i++)
            {
                var data = this.friendRank[i];
                if(data.nickname == this.userInfo.nickName &&
                    data.avatarUrl == this.userInfo.avatarUrl)
                {
                    var sdata = data;
                    sdata.num = i+1;
                    sdata.isself = true;
                    list.push(sdata);
                    if(i != 0)
                    {
                        if(i == this.friendRank.length-1)
                        {
                            if(this.friendRank.length >= 3)
                            {
                                var data2 = this.friendRank[i-1];
                                var sdata2 = data2;
                                sdata2.num = i;
                                sdata2.isself = false;
                                list.unshift(sdata2);

                                var data3 = this.friendRank[i-2];
                                var sdata3 = data3;
                                sdata3.num = i-1;
                                sdata3.isself = false;
                                list.unshift(sdata3);
                            }
                            else
                            {
                                var data2 = this.friendRank[i-1];
                                var sdata2 = data2;
                                sdata2.num = i;
                                sdata2.isself = false;
                                list.unshift(sdata2);
                            }
                        }
                        else
                        {
                            var data2 = this.friendRank[i-1];
                            var sdata2 = data2;
                            sdata2.num = i;
                            sdata2.isself = false;
                            list.unshift(sdata2);

                            if(i != this.friendRank.length-1)
                            {
                                var data3 = this.friendRank[i+1];
                                var sdata3 = data3;
                                sdata3.num = i+2;
                                sdata3.isself = false;
                                list.push(sdata3);
                            }
                        }
                    }
                    else
                    {
                        if(this.friendRank.length>=3)
                        {
                            var data2 = this.friendRank[i+1];
                            var sdata2 = data2;
                            sdata2.num = i+2;
                            sdata2.isself = false;
                            list.push(sdata2);
                            var data3 = this.friendRank[i+2];
                            var sdata3 = data3;
                            sdata3.num = i+3;
                            sdata3.isself = false;
                            list.push(sdata3);
                        }
                        else if(this.friendRank.length>=2)
                        {
                            var data2 = this.friendRank[i+1];
                            var sdata2 = data2;
                            sdata2.num = i+2;
                            sdata2.isself = false;
                            list.push(sdata2);
                        }
                    }
                    break;
                }
            }
            if(list.length > 0)
            {
                this.node_over_box1.active = true;
                var bg = cc.find("bg",this.node_over_box1);
                var num = cc.find("num",this.node_over_box1);
                var icon = cc.find("icon",this.node_over_box1);
                var nick = cc.find("name",this.node_over_box1);
                var score = cc.find("score",this.node_over_box1);

                var j1 = cc.find("j1",icon);
                var j2 = cc.find("j2",icon);
                var j3 = cc.find("j3",icon);

                bg.active = false;
                j1.active = false;
                j2.active = false;
                j3.active = false;


                var data = list[0];
                var feiji_rank = data.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                if(data.isself)
                {
                    bg.active = true;
                    num.color = cc.color(64,191,139,255);
                    nick.color = cc.color(64,191,139,255);
                }
                else
                {
                    num.color = cc.color(200,176,165,255);
                    nick.color = cc.color(135,99,82,255);
                }

                if(data.num == 1)
                    j1.active = true;
                else if(data.num == 2)
                    j2.active = true;
                else if(data.num == 3)
                    j3.active = true;


                num.getComponent("cc.Label").string = data.num+"";
                this.loadPic(icon,data.avatarUrl);
                nick.getComponent("cc.Label").string = data.nickname;
                score.getComponent("cc.Label").string = rank.wxgame.score+"";
            }

            if(list.length > 1)
            {
                this.node_over_box2.active = true;
                var bg = cc.find("bg",this.node_over_box2);
                var num = cc.find("num",this.node_over_box2);
                var icon = cc.find("icon",this.node_over_box2);
                var nick = cc.find("name",this.node_over_box2);
                var score = cc.find("score",this.node_over_box2);

                var j1 = cc.find("j1",icon);
                var j2 = cc.find("j2",icon);
                var j3 = cc.find("j3",icon);

                bg.active = false;
                j1.active = false;
                j2.active = false;
                j3.active = false;

                var data = list[1];
                var feiji_rank = data.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                if(data.isself)
                {
                    bg.active = true;
                    num.color = cc.color(64,191,139,255);
                    nick.color = cc.color(64,191,139,255);
                }
                else
                {
                    num.color = cc.color(200,176,165,255);
                    nick.color = cc.color(135,99,82,255);
                }

                if(data.num == 1)
                    j1.active = true;
                else if(data.num == 2)
                    j2.active = true;
                else if(data.num == 3)
                    j3.active = true;


                num.getComponent("cc.Label").string = data.num+"";
                this.loadPic(icon,data.avatarUrl);
                nick.getComponent("cc.Label").string = data.nickname;
                score.getComponent("cc.Label").string = rank.wxgame.score+"";
            }

            if(list.length > 2)
            {
                this.node_over_box3.active = true;
                var bg = cc.find("bg",this.node_over_box3);
                var num = cc.find("num",this.node_over_box3);
                var icon = cc.find("icon",this.node_over_box3);
                var nick = cc.find("name",this.node_over_box3);
                var score = cc.find("score",this.node_over_box3);

                var j1 = cc.find("j1",icon);
                var j2 = cc.find("j2",icon);
                var j3 = cc.find("j3",icon);

                bg.active = false;
                j1.active = false;
                j2.active = false;
                j3.active = false;

                var data = list[2];
                var feiji_rank = data.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                if(data.isself)
                {
                    bg.active = true;
                    num.color = cc.color(64,191,139,255);
                    nick.color = cc.color(64,191,139,255);
                }
                else
                {
                    num.color = cc.color(200,176,165,255);
                    nick.color = cc.color(135,99,82,255);
                }

                if(data.num == 1)
                    j1.active = true;
                else if(data.num == 2)
                    j2.active = true;
                else if(data.num == 3)
                    j3.active = true;


                num.getComponent("cc.Label").string = data.num+"";
                this.loadPic(icon,data.avatarUrl);
                nick.getComponent("cc.Label").string = data.nickname;
                score.getComponent("cc.Label").string = rank.wxgame.score+"";
            }

        }
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
            }
        });
    },


    showPaiming: function()
    {
        var self = this;
        this.node_paiming.active = true;
        this.node_paiming_content.removeAllChildren();
        var selfrank = null;
        if(this.friendRank && this.userInfo)
        {
            for(var i=0;i<this.friendRank.length;i++)
            {
                var data = this.friendRank[i];
                var feiji_rank = data.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                var item = cc.instantiate(this.paimingItem);
                var bg = cc.find("bg",item);
                var num = cc.find("num",item);
                var icon = cc.find("icon",item);
                var nick = cc.find("nick",item);
                var score = cc.find("score",item);

                var j1 = cc.find("j1",icon);
                var j2 = cc.find("j2",icon);
                var j3 = cc.find("j3",icon);

                if(i+1 == 1)
                    j1.active = true;
                else if(i+1 == 2)
                    j2.active = true;
                else if(i+1 == 3)
                    j3.active = true;

                num.getComponent("cc.Label").string = (i+1)+"";
                this.loadPic(icon,data.avatarUrl);
                nick.getComponent("cc.Label").string = data.nickname;
                score.getComponent("cc.Label").string = rank.wxgame.score+"";

                if(data.nickname == this.userInfo.nickName &&
                    data.avatarUrl == this.userInfo.avatarUrl)
                {
                    bg.active = true;
                    num.color = cc.color(200,176,165,255);
                    nick.color = cc.color(200,176,165,255);
                    score.color = cc.color(200,176,165,255);
                    selfrank = data;
                    selfrank.num = (i+1);
                }

                this.node_paiming_content.addChild(item);
            }
            if(selfrank)
            {
                var feiji_rank = selfrank.KVDataList[0].value;
                var rank  = JSON.parse(feiji_rank);

                var j1 = cc.find("j1",self.node_paiming_icon);
                var j2 = cc.find("j2",self.node_paiming_icon);
                var j3 = cc.find("j3",self.node_paiming_icon);
                j1.active = false;
                j2.active = false;
                j3.active = false;

                if(selfrank.num == 1)
                    j1.active = true;
                else if(selfrank.num == 2)
                    j2.active = true;
                else if(selfrank.num == 3)
                    j3.active = true;

                this.node_paiming_num.getComponent("cc.Label").string = selfrank.num+"";
                this.loadPic(self.node_paiming_icon,selfrank.avatarUrl);
                this.node_paiming_nick.getComponent("cc.Label").string = selfrank.nickname;
                this.node_paiming_score.getComponent("cc.Label").string = rank.wxgame.score+"";
            }

        }

    },

    getUserRank: function()
    {
        var self = this;
        wx.getUserCloudStorage({
            keyList:["xueqiu_rank"],
            success: function(res)
            {
                cc.log(res);
                if(res.KVDataList.length == 0)
                {
                    self.setUserRank(0,new Date().getTime(),0);
                }
                else
                {
                    var feiji_rank = res.KVDataList[0].value;
                    self.kvdata = JSON.parse(feiji_rank);
                    cc.log(self.kvdata);
                }
            }
        });
    },

    uploadScore: function(score)
    {
        if(this.kvdata)
        {
            if(score > this.kvdata.wxgame.score)
            {
                this.kvdata.wxgame.score = score;
                this.setUserRank(score,new Date().getTime(),this.kvdata.card);
            }
        }
        else
        {
            this.getUserRank();
        }
    },

    setUserRank: function(score,update_time,card)
    {
        var self = this;
        var data = {
            key: "xueqiu_rank",
            value: "{\"wxgame\":{\"score\":"+score+",\"update_time\": "+update_time+"},\"card\":"+card+"}"
        };

        var kvDataList = [data];
        wx.setUserCloudStorage({
            KVDataList: kvDataList,
            success: function(res)
            {
                self.kvdata.wxgame.score = score;
                self.getFriendRank();
                cc.log(res);
            },
            fail: function(res)
            {
                cc.log(res);
            }
        });
    },

    getFriendRank: function(callback)
    {
        var self = this;
        wx.getFriendCloudStorage({
            keyList:["xueqiu_rank"],
            success: function(res)
            {
                self.friendRank = res.data;
                self.sortFriendRank();
                cc.log(res);
                if(callback)
                    callback();
            }
        });
    },

    sortFriendRank: function()
    {
        if(this.friendRank)
        {
            this.friendRank.sort(function(a,b){
                var a_rank =JSON.parse(a.KVDataList[0].value);
                var AMaxScore=a_rank.wxgame.score;

                var b_rank =JSON.parse(b.KVDataList[0].value);
                var BMaxScore = b_rank.wxgame.score;

                return parseInt(BMaxScore) - parseInt(AMaxScore);
            });
        }
    }


});
