ig.module(
'plugins.impsock'
)
.requires(
'impact.impact'
)
.defines(function(){
    ig.Impsock = ig.Class.extend({
        init: function(game) {
            this.host = "http://dev.game.captaindashing.com:8080";
            this.game = game;
            this.sessionId = null;
            this.socket = null;
            this.clients = null;
            this.otherClients = [];
            this.disconnectedClients = [];
            this.establishSocket();
        },

        establishSocket: function() {
            var game = this.game;
            var self = this;
            this.socket = io.connect(this.host);
            
            this.socket.on('connect', function(){
                console.info("Socket connected");
            });

            this.socket.on('message', function(messageFromServer){
                self.processMessage(messageFromServer);
            });
        },

        /* Expects entire 'character' entity */
        broadcast: function(entity) {
            var properties = entity.syncableProperties();
            var message = {"action": "broadcast", "entity": properties};
            this.socket.emit('message', message);
        },

        processMessage: function(message) {
            /* Sample data inside message looks like this:
             {
                action: 'broadcast',
                entity: {
                    accel: {x: 0, y:0}, //player acceleration - movement calculated locally
                    vel: {x: 0, y: 0}, //player velocity - movement calculated locally
                    flip: true, //direction player is facing
                    name: "CptDashing333", //internal identifier
                    displayName: "BillyTheKid", //name that is displayed, originally set to .name 
                    pos: {x: 0, y: 0}, //absolute in-game position, used to correct .accel and .vel
                    sessionid: "dsfd342fjdsf343943$#43fdsf" //server assigned sessionid - eventually will resume lost connections
                }
             }
             */

            //Append new chat message to local user chat textarea
            if (message.action == "chatMessage") {
                //Simply append to textarea
                var FromName = message.entity.name;
                if (message.entity.displayName){
                    FromName = message.entity.displayName
                }
                //Wildly insecure I know, this is only a demo though, not meant for production use
                if (FromName == "SYS"){
                    $("#ChatWindow").append( "<strong class='from-name system-message'>" + message.chatMessage.replace(/(<([^>]+)>)/ig,"") + "</strong>" + '<br />');
                }else{
                    FromName = "<strong class='from-name'>" + escape(FromName) + "</strong>: "
                    $("#ChatWindow").append(FromName + message.chatMessage.replace(/(<([^>]+)>)/ig,"") + '<br />');
                }
                //Scroll the window down nicely if we fill it up
                $("#ChatWindow").animate({ scrollTop: $("#ChatWindow").prop("scrollHeight") - $("#ChatWindow").height() }, 500);
                return;
            }

            //Check the clients list to see if this name is known, if it's not, spawn that player in
            var found = false;
            for (var i = 0; this.otherClients.length > i; i++){
                if (message.entity.name == this.otherClients[i]){
                    found = true;
                    //If the action message is from a player disconnect, remove them from the array
                    if (message.action == "remove") {        
                        this.otherClients.remove(i);        
                        this.game.disconnectHandler(message);
                        return;
                    }
                }
            }

            if (!found && message.entity.pos != undefined){
                //console.log("Adding new client named:" + message.entity.name);
                this.otherClients.push(message.entity.name);
                this.game.spawnOtherPlayer(message);
                //Update your position so that the new player sees you
                this.game.getEntityByName(this.game.localUser).forceUpdate = true;
            }
            
            this.game.updateOtherPlayer(message);
        }
    });
});