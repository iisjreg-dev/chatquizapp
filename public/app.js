
Vue.use(Vuefire.rtdbPlugin);
Vue.use(VueRouter);

  // Initialize Firebase (now via init.js)
  //firebase.initializeApp(firebaseConfig);
  //firebase.analytics();
  var db = firebase.database();
  //var fs = firebase.firestore();

const usersRef = db.ref('users');
const roomsRef = db.ref('rooms');
//////COMPONENTS


var CompUserProfile = {
  props: ['user'],
  template: `
    <div>
      <h3 style="padding-right: 10px;">{{user.name}} <span uk-icon="icon: user; ratio: 1.5"></span></h3> 
    </div>
  `
};

var CompRoomProfile = {
  components:{
    'user-profile': CompUserProfile
  },
  props: ['room', 'user'],
  template: `
    <div class="uk-navbar-center" id="roomInfo">
      <div class="uk-visible@m">
        Room: <b><a :href="'/' + room.joinCode" uk-tooltip="title: Share this code or URL for others to join">{{room.joinCode}}</a></b> | 
        Host: <b>{{room.host}}</b> | 
        Questions: <b>{{room.totalQuestions}}</b> | 
        Description: <b>{{room.description}}</b>
      </div>
      <div class="uk-hidden@m uk-inline">
        <a><span uk-icon="icon: info; ratio: 1.5"></span></a>
        <div uk-drop="pos: bottom-center" class="uk-card uk-card-default uk-card-body">
          <user-profile v-bind:user="this.user"></user-profile>
          Room: <b><a :href="'/' + room.joinCode" uk-tooltip="title: Share this code or URL for others to join">{{room.joinCode}}</a></b> <br>
          Host: <b>{{room.host}}</b> <br> 
          Questions: <b>{{room.totalQuestions}}</b> <br> 
          Description: <b>{{room.description}}</b>
        </div>
      </div>
    </div>
  `
};



var CompMsgSection = {
  data: function(){
    var load = {
      'messages': []
    };
    return load;
  },
  props: ['roomCode','user','isHost','currentQuestion'],
  updated: function () {
    this.$nextTick(function () {
      // Code that will run only after the
      // entire view has been re-rendered
      document.getElementById("chatOutput").scrollTop = document.getElementById("chatOutput").scrollHeight;
    })
  },
  // firebase() {
  //   return {
  //     messages: db.ref('rooms/' + this.room.joinCode + '/messages'),
  //   }
  // },
  watch: {
    roomCode: {
      // call it upon creation too
      immediate: true,
      handler(val) {
        this.$rtdbBind('messages', roomsRef.child(val + '/messages'));
      },
    },
  },
  methods: {
    markCorrect: function(msg,user,name,text,event){
      //console.log(msg);
      var message = db.ref('rooms/' + this.roomCode + '/messages/' + msg);
      message.update({'correct': true});
      var scoreRef = db.ref('rooms/' + this.roomCode + '/scores/' + user);
      scoreRef.once('value').then(function(snapshot){
        if(snapshot.val()){
          //console.log(snapshot.val());
          var score = snapshot.val().score;
          if(!score){score = 0;}
          scoreRef.child("score").set(score + 1);
        }
      });
      //set answer
      var question = this.currentQuestion.id;
      var qRef = db.ref('rooms/' + this.roomCode + '/questions/' + question);
      qRef.child("answer").set(text);
      qRef.child("answerName").set(name);
      var aRef = db.ref('rooms/' + this.roomCode + '/currentQuestion');
      aRef.child("answered").set(true);
      document.getElementById("chatInput").focus();
    },
    addReaction: function(msg,reaction,event){
      var vm = this;

      db.ref('rooms/' + this.roomCode + '/messages/' + msg + '/reactions').push({
        'type': reaction,
        'userName': this.user.name,
        'timestamp': firebase.database.ServerValue.TIMESTAMP
      });
      vm.newMessage = '';
      document.getElementById("chatInput").focus();

    }
  },
  template: `
    <div>
      <div class="uk-card uk-card-default uk-width-1-1" v-for="message in messages" :key="message['.key']" v-bind:class="{ 'uk-card-primary': message.correct, 'uk-background-muted': message.host }">
        <div class="uk-card-header" style="padding: 10px">
            <div class="uk-grid-small uk-flex-middle" uk-grid>
                <div class="uk-width-auto">
                    <span v-if="message.correct" uk-icon="icon: check; ratio: 1.5"></span>
                    <button v-if="isHost && !message.host && !message.correct && !currentQuestion.answered && currentQuestion.number > 0" class="uk-button uk-button-default uk-button-small" uk-icon="check" @click="markCorrect(message['.key'], message.user, message.userName, message.text, $event)"></button>
                </div>
                <div class="uk-width-expand">
                    <h4 class="uk-margin-remove-bottom">{{message.userName}}</h4>
                    <p class=" uk-margin-remove-top">
                      {{message.text}}
                      <span v-for="reaction in message.reactions" :key="reaction['.key']">
                        <span class="uk-text-primary" v-bind:uk-icon="reaction.type" v-bind:uk-tooltip="reaction.userName"></span>
                      </span>
                    </p>
                    
                </div>
                <div class="uk-width-auto" v-if="user.uid != message.user">
                    <div class="uk-inline">
                      <button type="button" uk-icon="icon: smile; ratio: 1.5"></button>
                      <div uk-drop="pos: left-center">
                        <div class="uk-card uk-card-body uk-card-default uk-padding-small uk-float-right">
                          
                          <button type="button" uk-icon="icon: smile; ratio: 1.5" @click="addReaction(message['.key'], 'smile', $event)"></button>
                          <button type="button" uk-icon="icon: neutral; ratio: 1.5" @click="addReaction(message['.key'], 'neutral', $event)"></button>
                          <button type="button" uk-icon="icon: sad; ratio: 1.5" @click="addReaction(message['.key'], 'sad', $event)"></button>
                          <button type="button" uk-icon="icon: star; ratio: 1.5" @click="addReaction(message['.key'], 'star', $event)"></button>
                          <button type="button" uk-icon="icon: heart; ratio: 1.5" @click="addReaction(message['.key'], 'heart', $event)"></button>
                          <button type="button" uk-icon="icon: poop; ratio: 1.5" @click="addReaction(message['.key'], 'poop', $event)"></button>
                          <button type="button" uk-icon="icon: question-circle; ratio: 1.5" @click="addReaction(message['.key'], 'question-circle', $event)"></button>
                          
                          </div>
                      </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    
  `
};


var CompQASection = {
  data: function(){
    var load = {
      'questions': []
    };
    return load;
  },
  updated: function () {
    this.$nextTick(function () {
      // Code that will run only after the
      // entire view has been re-rendered
      document.getElementById("qaOutput").scrollTop = document.getElementById("qaOutput").scrollHeight;
    })
  },
  props: ['roomCode', 'user', 'currentQuestion'],
  // firebase() {
  //   return {
  //     questions: db.ref('rooms/' + this.room.joinCode + '/questions'),
  //   }
  // },
  watch: {
    roomCode: {
      // call it upon creation too
      immediate: true,
      handler(val) {
        this.$rtdbBind('questions', roomsRef.child(val + '/questions'));
      },
    },
  },
  template: `
    <div>
      <div v-if="this.currentQuestion.number > 0">
        <div v-for="question in questions" :key="question['.key']">
          <div class="uk-card uk-card-default uk-card-body uk-width-1-1 uk-padding-small">
            <div class="uk-card-badge uk-label">Q {{question.number}}</div><p>&nbsp;</p>
            <p class="uk-dropcap">Q {{question.question}}</p>
            <div v-if="question.file.url" class="uk-padding-small uk-padding-remove-bottom"><img :src="question.file.url" style="object-fit: contain;"></div>
            <p v-if="question.answer" class="uk-dropcap uk-float-right" style="min-width: 120px;">A {{question.answer}} <br><i>({{question.answerName}})</i></p>
          </div>
          <hr class="uk-divider-icon">
        </div>
      </div>
      <div v-else>
        <div class="uk-card uk-card-muted uk-card-body uk-width-1-1 uk-padding-small">
          <p class="uk-text-large uk-text-muted uk-text-center"><span uk-icon="icon: clock; ratio: 1.5;"></span> Questions will soon appear here.</p>
        </div>
        <hr class="uk-divider-icon uk-visible@m">
      </div>
    </div>
  `
};

var CompScoreSection = {
  data: function(){
    var load = {
      'scores': []
    };
    return load;
  },
  props: ['roomCode', 'user'],
  // firebase() {
  //   return {
  //     scores: db.ref('rooms/' + this.room.joinCode + '/scores'),
  //   }
  // },
  watch: {
    roomCode: {
      // call it upon creation too
      immediate: true,
      handler(val) {
        this.$rtdbBind('scores', roomsRef.child(val + '/scores'));
      },
    },
  },
  methods: {
    isOffline: function(uid){
      if(uid){
        var presence = db.ref('users/' + uid + '/presence');
        presence.on('value', function(snapshot) {
          //console.log("user.uid: " + uid + " - " + snapshot.exists());
          return !snapshot.exists();
        });
      }
      else{return false}
    }
  },
  computed: {
    sortedScores: function(){
      var tempScores = this.scores.map(function(item){
        if(item.hasOwnProperty('score') == false || item.score == ''){item.score = 0}
        return item;
      });
      return tempScores.sort(function(a,b){return b.score - a.score});
    }
  },
  template: `
    <div>
      <table class="uk-table uk-table-striped">
        <tbody>
          <tr v-for="score in sortedScores" :key="score['.key']">
            <td>
              <b>{{score.name}} <span v-if="score.winner" class="uk-label uk-label-success uk-float-right">Winner! <span uk-icon="icon: diamond; scale: 2.0;"></span></span></b>
            </td>
            <td>
              {{score.score}}
            
              <span v-show="isOffline(score.uid)" uk-icon="icon: link; scale: 0.5;" uk-tooltip="title: Offline"></span>

            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};


var CompLoad = {
  props: ['userId'],
  data: function(){
    var load = {
      user: {},
      'name': '',
      'description': '',
      'questions': 0,
      'joinCode': ''
    };
    return load;
  },
  // firebase() {
  //   return {
  //     user: db.ref('users/' + this.userId),
  //   }
  // },
  watch: {
    userId: {
      // call it upon creation too
      immediate: true,
      handler(id) {
        this.$rtdbBind('user', usersRef.child(id));
      },
    },
  },
  methods: {
    select: function(event){
      event.srcElement.select();
    },
    newroom: function(event){
      var vm = this;
      if(vm.$root.auth.uid){
        var newRoomCode = Math.random().toString(36).substr(2, 8);
        console.log("newRoomCode = " + newRoomCode);
        
        var host = db.ref('rooms/' + newRoomCode + '/hosts');
        host.child(vm.$root.auth.uid).set(true);
        
        var newRoom = db.ref('rooms/' + newRoomCode);
        //vm.roomKey = newRoomCode;
        var room = {
          'settings': {
            'joinCode': newRoomCode,
            'host': vm.user.name,
            'description': vm.description,
            'status': 'created',
            'timestamp': firebase.database.ServerValue.TIMESTAMP,
            'totalQuestions': vm.questions
          },
          'currentQuestion': {
            'id': '',
            'number': 0,
            'answered': false
          }
        };
        
        newRoom.update(room);
        
        
        vm.$root.app.roomcode = newRoomCode;
        vm.$root.app.isHost = true;
        vm.$root.app.inRoom = true;
        
        var userRec = db.ref('users/' + vm.$root.auth.uid);
        userRec.child('name').set(vm.user.name);
        userRec.child('rooms/' + newRoomCode).set(true);
        
        //this.$router.push({ path: `/${newRoomCode}` });
      
      }
      else{console.log("cant create room, not signed in");}
    },
    joinroom: function(event){
      var vm = this;
      var user = vm.$root.auth;
      if(user.uid){
        var room = db.ref('rooms/' + vm.joinCode + '/settings' ).once('value').then(function(snapshot){
          if(snapshot.val()){
            
            var userRecRoom = db.ref('rooms/' + vm.joinCode + '/users');
            userRecRoom.child(user.uid).set(true);
            
            var score = db.ref('rooms/' + vm.joinCode + '/scores/' + user.uid);
            score.update({
              'name': vm.user.name,
              'uid': vm.user.uid,
              'status': 'ready'
            });
            
            vm.$root.app.roomcode = vm.joinCode;
            vm.$root.app.inRoom = true;
        
            var userRec = db.ref('users/' + user.uid);
            userRec.child('name').set(vm.user.name);
            userRec.child('rooms/' + vm.joinCode).set(true);
          }
          else{
            console.log("room " + vm.joinCode + " does not exist");
          }
        });
      }
    }
  },
  created: function(){
    //if(firebase.auth()){console.log(firebase.auth())}
    if (this.$route.params.roomJoinCode){
      this.joinCode = this.$route.params.roomJoinCode;
    }
    
  },
  mounted: function(){
    this.$nextTick(function () {
      document.getElementById("newName").focus();
    })
  },
  template: `
    <div>
      <div class="uk-section uk-section-large uk-section-muted" style="min-height: 100vh;">
        <div class="uk-container">

          <div class="uk-panel uk-margin-medium">
            <h3><img src="leChatLogo.png" style="height: 100px;" alt="Le Chat Quiz"></h3>
            <p>Welcome to le Chat. This is a simple chat app but includes features to support running quizzes where answers are entered in the chat.</p>
            <p><b> Faster fingers first!</b></p>
          </div>
        
          <div class="uk-grid-match uk-child-width-expand@m" uk-grid>
            <div class="uk-card uk-card-default">
              <div class="uk-card-body">
                <p><b>Firstly, what's your name?</b></p>
                <div class="uk-inline uk-width-1-1">
                  <span class="uk-form-icon" uk-icon="icon: user"></span>
                  <input v-model="user.name" class="uk-input" type="text" placeholder="name" id="newName">
                </div>
              </div>
            </div>
            <div class="uk-card uk-card-default">
              <div class="uk-card-body">
                <p><b>Then, create a new room:</b></p>
                <p>Enter a description for the quiz:</p>
                <div class="uk-inline uk-width-1-1">
                  <span class="uk-form-icon" uk-icon="icon: info"></span>
                  <input v-model="description" class="uk-input" type="text" placeholder="description">
                </div>
                <p>How many questions will there be?</p>
                <div class="uk-inline uk-width-1-1">
                  <span class="uk-form-icon" uk-icon="icon: hashtag"></span>
                  <input v-model="questions" @focus="select" @keyup.enter="newroom" class="uk-input" type="number">
                </div>
              </div>
              <div class="uk-card-footer">
                <button @click="newroom" class="uk-button uk-button-default uk-modal-close uk-width-1-1" type="button" :class="{'uk-button-primary': !this.$route.params.roomJoinCode}">Create</button>
              </div>
            </div>
            <div class="uk-card uk-card-default">
              <div class="uk-card-body">
                <p><b>Or, join a room:</b></p>
                <p>Enter the room code:</p>
                <div class="uk-inline uk-width-1-1">
                  <span class="uk-form-icon" uk-icon="icon: lock"></span>
                  <input v-model.trim="joinCode" @keyup.enter="joinroom" class="uk-input" :class="{'uk-form-success': this.$route.params.roomJoinCode}" type="text" placeholder="xxxxxxxx">
                </div>
              </div>
              <div class="uk-card-footer">
                <button @click="joinroom" class="uk-button uk-button-default uk-modal-close uk-width-1-1" type="button" :class="{'uk-button-primary': this.$route.params.roomJoinCode}">Join</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

var CompInRoom = {
  components:{
    'user-profile': CompUserProfile,
    'room-profile': CompRoomProfile,
    'msg-section': CompMsgSection,
    'qa-section': CompQASection,
    'score-section': CompScoreSection
  },
  props: ['roomCode','userId'],
  data: function(){
    var load = {
      'user': {},
      'roomSettings': {
        'joinCode': '',
        'host': '',
        'description': '',
        'status': '',
        'timestamp': '',
        'totalQuestions': 0
      },
      'currentQuestion': {
        'id': '',
        'number': 0,
        'answered': false
      },
      'newMessage': '',
      'newQ': '',
      'newFile': {
        'url': '',
        'ref': ''
      },
      'fileLoading': false
    };
    return load;
  },
  firebase() {
    return {
      currentQuestion: db.ref('rooms/' + this.roomCode + '/currentQuestion'),
    }
  },
  watch: {
    userId: {
      // call it upon creation too
      immediate: true,
      handler(id) {
        this.$rtdbBind('user', usersRef.child(id));
      }
    },
    roomCode: {
      // call it upon creation too
      immediate: true,
      handler(id) {
        this.$rtdbBind('roomSettings', roomsRef.child(id + '/settings'));
      }
    },
  },
  methods:{
    sendMessage: function(event){
      var vm = this;
      if(vm.$root.app.inRoom && vm.$root.auth){
        var host = false;
        if (vm.$root.app.isHost && vm.$root.app.isHost == true){host = true;}
        var newMsgRef = db.ref('rooms/' + vm.roomCode + '/messages').push();
        newMsgRef.update({
          'text': vm.newMessage,
          'user': vm.user.uid,
          'userName': vm.user.name,
          'host': host,
          'timestamp': firebase.database.ServerValue.TIMESTAMP
        });
        vm.newMessage = '';
        document.getElementById("chatInput").focus();
      }
    },
    loadImage: function(event){
      //open file dialog
      document.getElementById("mediaCapture").click();
    },
    attachImage: function(event){
      var vm = this;
      var file = event.target.files[0];
      //document.getElementById("mediaCapture").reset();
      document.getElementById("mediaCapture").value = "";
      //console.log(file);
      
      if (file.type.match('image.*')) {
        vm.fileLoading = true;
        //var filePath = firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
        var filePath = 'rooms/' + vm.roomCode + '/files/' + file.name;
        
        var upload = firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
          //console.log("uploading: " + file);
          return fileSnapshot.ref.getDownloadURL().then((url) => {
            //console.log("uploaded: " + url);
            vm.fileLoading = false;
            vm.newFile = {
              'url': url,
              'ref': filePath
            };
          });
        });
      }
    },
    deleteImage: function(event){
      //remove file
      var vm = this;
      
      var ref = firebase.storage().ref(vm.newFile.ref);
      ref.delete().then(function() {
        //console.log("file deleted");
      }).catch(function(error) {
        // Uh-oh, an error occurred!
        console.log("file NOT deleted: " + error);
      });
      vm.newFile = {
        'url': '',
        'ref': ''
      };
    },
    endQuiz: function(event){
      var vm = this;
      //end quiz
      db.ref('rooms/' + vm.$root.app.roomcode + '/settings').update({
        'status': 'ended'
      });
      //find winner
      var winningScore = db.ref('rooms/' + vm.$root.app.roomcode + '/scores' ).orderByChild('score').limitToLast(1);
      winningScore.once('value').then(function(snapshot){
        snapshot.forEach(function(childSnapshot) {
          //console.log(childSnapshot.key);
          db.ref('rooms/' + vm.$root.app.roomcode + '/scores/' + childSnapshot.key).update({'winner': true});
        });
      });
    },
    sendQA: function(event){
      var vm = this;
      if(vm.$root.app.inRoom && vm.$root.auth && vm.$root.app.isHost == true){
        var total = vm.roomSettings.totalQuestions;
        var num = vm.currentQuestion.number + 1;
        var newQ = db.ref('rooms/' + vm.$root.app.roomcode + '/questions').push().key;
        
        db.ref('rooms/' + vm.$root.app.roomcode + '/questions/' + newQ).update({
          'question': vm.newQ,
          'number': num,
          'timestamp': firebase.database.ServerValue.TIMESTAMP,
          'file': vm.newFile
        });
        db.ref('rooms/' + vm.$root.app.roomcode + '/currentQuestion').update({
          'id': newQ,
          'number': num,
          'answered': false
        });
        if(num > total){
          total = num;
          db.ref('rooms/' + vm.$root.app.roomcode + '/settings').update({
            'totalQuestions': total
          });
        }
        db.ref('rooms/' + vm.$root.app.roomcode + '/settings').update({
          'status': 'started'
        });
        
        vm.newQ = '';
        vm.newFile = {
          'url': '',
          'ref': ''
        };
        document.getElementById("chatInput").focus();
      }
    }
  },
  mounted: function(){
    this.$nextTick(function () {
      document.getElementById("chatInput").focus();
    })
  },
  template: `
    <div id="grid-container">
  <div class="container">
    <div class="header">
      <nav class="uk-navbar-container uk-margin" uk-navbar>
      
        <div class="uk-navbar-left">
          <a style="padding-left: 10px; padding-top: 10px;" href="#"><img src="leChatLogo.png" style="height: 6vh;"></a>
        </div>
        
        <room-profile v-bind:room="this.roomSettings" v-bind:user="this.user"></room-profile>
        
        <div class="uk-navbar-right uk-visible@m">
          <user-profile v-bind:user="this.user"></user-profile>
        </div>
        
        <div class="uk-navbar-right uk-hidden@m" style="padding-right: 20px;">
          <a href="#mobile-scores" uk-toggle><span uk-icon="icon: list; ratio: 1.5"></span></a>
        </div>
        
      </nav>
    </div>
    
    
    <div class="left-header uk-background-muted uk-padding-small">
      <h3>Q & A <span  class="uk-float-right uk-background-muted">{{this.currentQuestion.number}} of {{this.roomSettings.totalQuestions}}</span></h3>
    </div>
    
    <div class="left-content uk-background-muted" id="qaOutput">
      <hr>
      <qa-section v-bind:room-code="this.roomSettings.joinCode" v-bind:user="this.user" v-bind:currentQuestion="this.currentQuestion"></qa-section>
    </div>
    
    
    <div class="left-footer uk-background-muted">
      <div class="uk-flex">
        <div class="uk-width-expand" v-if="this.$root.app.isHost && this.roomSettings.status != 'ended'">
        <form id="qaInputForm" @submit.prevent="sendQA">
          <fieldset class="uk-fieldset">
            <div class="uk-inline uk-width-1-1">
              <span v-if="fileLoading" class="uk-form-icon uk-form-icon-flip" uk-icon="icon: cloud-upload; scale: 1.5;" uk-tooltip="title: Uploading..."></span>
              <a v-else-if="!newFile.url" class="uk-form-icon uk-form-icon-flip uk-animation-fade" href="" @click.prevent="loadImage" uk-icon="icon: image; scale: 1.5;" uk-tooltip="title: Upload picture for this question"></a>
              <input id="qaInput" v-model="newQ" class="uk-input" type="text" placeholder="New Question">
              <input id="mediaCapture" type="file" accept="image/*" capture="camera" style="display: none;" @change.prevent="attachImage">
            </div>
          </fieldset>
        </form>
        </div>
        <div class="new-file-preview uk-inline uk-text-center uk-animation-fade" v-if="newFile.url">
          <a><img :src="newFile.url" style="object-fit: contain; height: 100%; width: auto"></a>
          <div uk-drop="pos: top-left">
            <div class="uk-card uk-card-small uk-card-default uk-padding-small uk-float-right ">
              <div class="uk-card-body">
                <img :src="newFile.url" style="height: auto; width: 100%">
              </div>
              <div class="uk-card-footer">
                <a class="uk-button uk-button-text uk-float-right" @click="deleteImage">Delete image</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      
    <div class="centre-content" id="chatOutput">
      <msg-section v-bind:room-code="this.roomSettings.joinCode" v-bind:user="this.user" v-bind:is-host="this.$root.app.isHost" v-bind:currentQuestion="this.currentQuestion"></msg-section>
    </div>
      
    <div class="centre-footer uk-background-muted">
      <div>
        <form id="chatInputForm" @submit.prevent="sendMessage">
          <fieldset class="uk-fieldset">
            <div class="uk-inline uk-width-1-1">
              <input id="chatInput" v-model="newMessage" class="uk-input" type="text" placeholder="Chat">
            </div>
          </fieldset>
        </form>
      </div>
    </div>
      
    <div class="right-header uk-background-muted uk-padding-small">
      <h3>Scores <a v-if="this.$root.app.isHost && this.roomSettings.status != 'ended'" class="uk-button uk-button-default uk-button-small uk-float-right" @click.prevent="endQuiz"><span uk-icon="icon: file-edit; ratio: 1"></span>&nbsp;&nbsp; End Quiz</a></h3>
    </div>
      
    <div class="right-content uk-background-muted">
      <score-section v-bind:room-code="this.roomSettings.joinCode" v-bind:user="this.user"></score-section>
    </div>
    
    <!-- OFF CANVAS -->
    <div id="mobile-scores" uk-offcanvas="flip: true; overlay: true">
      <div class="uk-offcanvas-bar">
        <button class="uk-offcanvas-close" type="button" uk-close></button>
        <h3>Scores <a v-if="this.$root.app.isHost && this.roomSettings.status != 'ended'" class="uk-button uk-button-default uk-button-small uk-float-right" @click.prevent="endQuiz"><span uk-icon="icon: file-edit; ratio: 1"></span>&nbsp;&nbsp; End Quiz</a></h3>
        <score-section v-bind:room-code="this.roomSettings.joinCode" v-bind:user="this.user"></score-section>
      </div>
    </div>
      
  </div>

</div>
  `
};


var CompAuth = {
  created: function(){
    
    //SIGN IN WHEN LOADED
    var vm = this;

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        console.log("firebase anon signin success: " + user.uid);
        //update auth
        vm.$root.auth = {
          uid: user.uid,
          isAnonymous: user.isAnonymous
        };
        //update user
        var userRec = db.ref('users/' + user.uid);
        userRec.update(vm.$root.auth);
        //presence
        var amOnline = db.ref('.info/connected');
        var userRef = db.ref('users/' + user.uid + '/presence');
        amOnline.on('value', function(snapshot) {
          if (snapshot.val()) {
            userRef.onDisconnect().remove();
            userRef.set(true);
          }
        });
        


      } 
      else{
        // User is not signed in.
        console.log("firebase anon signed out");
        vm.$root.auth = {}
      }
    });
    
    if(!vm.$root.auth.uid){
      firebase.auth().signInAnonymously().catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        if(error){console.log("firebase anon signin error: " + error.message)}
      });
    }
    else{
      console.log("auth.uid already exists: ", vm.$root.auth.uid);
    }
  },
  template: `
    <div style="display: table;  position: absolute;  top: 0;  left: 0;  height: 100%;  width: 100%;">
      <div style="background: #f8f8f8; width:100%; height:100%; min-height: 100vh; display: table-cell; vertical-align: middle;">
        <div class="uk-text-center">
          <img src="leChatLogo.png" style="height: 100px;" alt="Le Chat Quiz"><br>
          <div uk-spinner="ratio: 3"></div>
        </div>
      </div>
    </div>
  `
};



const router = new VueRouter({
  mode: 'history',
  routes: [
    // dynamic segments start with a colon
    { path: '/:roomJoinCode', component: CompAuth },
    { path: '*', component: CompAuth }
  ]
})

  
new Vue({
    el: '#app',
    router: router,
    components:{
      'load': CompLoad,
      'in-room': CompInRoom,
      'auth': CompAuth
    },
    data:{
      auth: {},
      app: {
        inRoom: false,
        isHost: false,
        roomcode: ''
      }
    }

  });
  

  
    // <msg-item 
    //     v-for="message in messages"
    //     :key="message.key"
    //     :message="message"
    //     :user="user"
    //   ></msg-item>