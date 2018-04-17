var viewer;
var markup;
var DBURL = 'http://localhost:3000';


// Vue.js components
window.app = new Vue({
  el: "#app",
  
  data: {
    Items: [ { title: 'loading...', url:"" }]
  },
  methods: {
    init: function() {
      this.loadData();
      this.initializeViewer();
    },

    initializeViewer: function() {
      viewer = new Autodesk.Viewing.Private.GuiViewer3D(document.getElementById('forgeViewer'), {});
      var options = {
          env: "Local",
          useADP: false,
          urn: "7c81ddf9-e5c7-acda-962f-189ba09e294d_f2d/primaryGraphics.f2d"
      }
      Autodesk.Viewing.Initializer( options, function() {
          viewer.start(options.urn, options, onSuccess);            
      });
      function onSuccess() {
          //viewer.loadExtension('Autodesk.Viewing.MarkupsCore').then(function(markupsExt){
           // markup = markupsExt;
          //});
      }
    },

    removeItem: function (item) {
      this.Items = this.Items.filter( i => {return i.MarkupID != item});
      //@@@ To Do:  Add api to remove item from MySQL
    },

    cardClick: function (item) {
      //load measurement
      if (!item.completed) {
        viewer.dispatchEvent(new CustomEvent('removeData', {'detail': item.MarkupID}));
      } else {
        // mark all items with ID from database.  This will be used to remove items and set hover effects
        Object.keys(item.json).map(i=>item.json[i].id=item.MarkupID);
        viewer.dispatchEvent(new CustomEvent('newData', {'detail': item.json}));
      }
    },

    loadData: function() {
      //uncomment this out at activate live MySQL data
//      fetch(`${DBURL}/allMarkup?approvalid=1`).then(r => r.json()).then( data=> {
      fetch(`dummydata.json`).then(r => r.json()).then( data=> {
          this.Items = data;
          this.Items.forEach(i => i.json=JSON.parse(i.json));
      })
    }
  },

  computed: {
    totalSqrFeet() {
      return this.Items
        .filter(i => i.completed )
        .reduce((acc, val) => acc + val.sqrfoot, 0 );
    },
  }
})
