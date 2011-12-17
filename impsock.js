ig.module(
  'plugins.impsock'
)
.requires(
  'impact.impact'
)
.defines(function(){
  ig.Impsock = ig.Class.extend({
    init: function(game) {
      this.host = "http://192.168.2.200:8080";
      this.game = game;
      this.sessionId = null;
      this.socket = null;
      this.clients = null;
      this.otherClients = null;
      this.disconnectedClients = [];
      
      this.establishSocket();
    },
    
    establishSocket: function() {
      var game = this.game;
      var self = this;
      this.socket = io.connect(this.host);
      
      this.socket.on('connect', function(){
        self.sessionId = this.socket.sessionid;
      });        
      this.socket.on('message', function(messageFromServer){
        self.processMessage(messageFromServer);
      });
      
    },
    
    broadcast: function(e) {
      var properties = e.syncableProperties();
      properties.sessionId = e.name;

      var message = {"action": "broadcast", "entity": properties};
      this.socket.emit('message', message);
    },
    
    processMessage: function(messageFromServer) {
      if (messageFromServer.spawn) {
        this.game.joinHandler(messageFromServer);
        return;
      }
      if (messageFromServer.remove) {
        this.game.disconnectHandler(messageFromServer);
        return;
      }
      this.game.broadcastHandler(messageFromServer);
    }
  });
});