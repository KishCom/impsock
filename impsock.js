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
             {"action": "spawn", //standard is 'message'
              "entity": //Obviously not the whole entitiy, only the 'syncableProperties'
                 {"pos":{"x": localUser.pos.x ,"y": localUser.pos.y}, 
                 "sessionId": localUser.sessionId, "name": localUser.name}
             }
             */
           /* if (message.action == "spawn") {
                this.game.spawnOtherPlayer(message);
                return;
            }*/

            //Check the clients list to see if this name is known, if it's not, spawn that player in
            var found = false;
            for (var i = 0; this.otherClients.length > i; i++){
                if (message.entity.name == this.otherClients[i]){
                    found = true;
                }
            }
            if (!found){
                console.log("Adding new client named:"+message.entity.name);
                this.otherClients.push(message.entity.name);
                this.game.spawnOtherPlayer(message);
            }

            if (message.action == "remove") {
                this.game.disconnectHandler(message);
                return;
            }
            
            this.game.updateOtherPlayer(message);
        }
    });
});