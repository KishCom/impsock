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
                    accel: {x: 0, y:0},
                    flip: true,
                    name: "CptDashing333",
                    pos: {x: 0, y: 0},
                    sessionid: "dsfd342fjdsf343943$#43fdsf",
                    vel: {x: 0, y: 0}
                }
             }
             */

            //Append new chat message to local user chat textarea
            if (message.action == "chatMessage") {
                //Will handle chat messages
                console.log("Implement me");
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

            if (!found){
                console.log("Adding new client named:" + message.entity.name);
                this.otherClients.push(message.entity.name);
                this.game.spawnOtherPlayer(message);
                //Update your position so that the new player sees you
                this.game.getEntityByName(this.game.localUser).forceUpdate = true;
            }
            
            this.game.updateOtherPlayer(message);
        }
    });
});